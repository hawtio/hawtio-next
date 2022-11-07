import { userService } from '@hawtio/auth'
import { getCookie } from '@hawtio/util/cookies'
import { escapeMBeanPath, onListSuccess } from '@hawtio/util/jolokia'
import { isObject } from '@hawtio/util/objects'
import Jolokia, { IAjaxErrorFn, IJmxDomain, IJmxDomains, IJmxMBean, IJolokia, IListOptions, IOptions, ISearchOptions, ISimpleOptions, IVersion, IVersionOptions } from 'jolokia.js'
import $ from 'jquery'
import { func, is, object } from 'superstruct'
import { connectService, PARAM_KEY_CONNECTION } from './connect-service'
import { Connection } from './connections'

const log = console

const DEFAULT_MAX_DEPTH = 7
const DEFAULT_MAX_COLLECTION_SIZE = 50000
const DEFAULT_JOLOKIA_OPTIONS: IOptions = {
  method: 'POST',
  mimeType: 'application/json',
  maxCollectionSize: DEFAULT_MAX_COLLECTION_SIZE,
  maxDepth: DEFAULT_MAX_DEPTH,
  canonicalNaming: false,
  canonicalProperties: false,
  ignoreErrors: true,
} as const
const DEFAULT_UPDATE_RATE = 5000

const JOLOKIA_PATHS = [
  '/hawtio/jolokia',
  '/jolokia',
  'jolokia',
] as const

enum JolokiaListMethod {
  /** The default LIST+EXEC Jolokia operations. */
  DEFAULT,
  /** The optimised list operations provided by Hawtio RBACRegistry MBean. */
  OPTIMISED,
  /** Not determined. */
  UNDETERMINED,
}

/**
 * This is really a MBean that provides an optimised Jolokia list operation,
 * with optionally decorated RBAC info on the result.
 */
const OPTIMISED_JOLOKIA_LIST_MBEAN = "hawtio:type=security,name=RBACRegistry"

export interface JolokiaConfig {
  method: JolokiaListMethod
  mbean: string
}

export const STORAGE_KEY_JOLOKIA_OPTIONS = 'connect.jolokia.options'
export const STORAGE_KEY_UPDATE_RATE = 'connect.jolokia.updateRate'

class JolokiaService {
  private jolokiaUrl: Promise<string | null>
  private jolokia: Promise<IJolokia>
  private config: JolokiaConfig = {
    method: JolokiaListMethod.DEFAULT,
    mbean: OPTIMISED_JOLOKIA_LIST_MBEAN,
  }

  constructor() {
    this.jolokiaUrl = new Promise((resolve) => {
      this.initJolokiaUrl().then(url => resolve(url))
    })
    this.jolokia = new Promise((resolve) => {
      this.createJolokia().then(jolokia => resolve(jolokia))
    })
  }

  private async initJolokiaUrl(): Promise<string | null> {
    const url = new URL(window.location.href)
    const searchParams = url.searchParams
    log.debug("Checking search params:", searchParams.toString())

    // Check remote connection from URL query param
    const conn = searchParams.get(PARAM_KEY_CONNECTION)
    if (conn) {
      // Remote connection
      log.debug('Connection name', conn, 'provided, not discovering Jolokia')
      return connectService.getJolokiaUrlFromName(conn)
    }

    // Discover Jolokia
    for (const path of JOLOKIA_PATHS) {
      log.debug("Checking Jolokia path:", path)
      try {
        return await this.tryProbeJolokiaPath(path)
      } catch (e) {
        // ignore
      }
    }

    return null
  }

  private async tryProbeJolokiaPath(path: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      $.ajax(path)
        .done((data: string, textStatus: string, xhr: JQueryXHR) => {
          if (xhr.status !== 200) {
            reject()
            return
          }

          try {
            const resp = JSON.parse(data)
            if ('value' in resp && 'agent' in resp.value) {
              log.debug('Found jolokia agent at:', path, 'version:', resp.value.agent)
              resolve(path)
              return
            }
          } catch (e) {
            // Parse error should mean redirect to html
            reject(e)
            return
          }
          reject()
        })
        .fail((xhr: JQueryXHR) => {
          if (xhr.status === 401 || xhr.status === 403) {
            // I guess this could be it...
            log.debug("Using URL:", path, "assuming it could be an agent but got return code:", xhr.status)
            resolve(path)
            return
          }
          reject(`${xhr.status} ${xhr.statusText}`)
        })
    })
  }

  private async createJolokia(): Promise<IJolokia> {
    const jolokiaUrl = await this.jolokiaUrl
    if (!jolokiaUrl) {
      log.debug("Use dummy Jolokia")
      return new DummyJolokia()
    }

    // TODO: hawtio-oauth may have already set up jQuery beforeSend?
    if (!$.ajaxSettings.beforeSend) {
      log.debug("Set up jQuery beforeSend")
      $.ajaxSetup({ beforeSend: this.beforeSend() })
    }

    const options = await this.loadJolokiaOptions()
    if (!options.ajaxError) {
      options.ajaxError = this.ajaxError()
    }

    const jolokia = new Jolokia(options)
    jolokia.stop()

    // let's check if we can call faster jolokia.list()
    await this.checkListOptimisation(jolokia)

    return jolokia
  }

  private beforeSend(): JQueryBeforeSend {
    const connection: Connection = {} as Connection
    // Just set Authorization for now...
    const header = 'Authorization'
    if (userService.isLogin() && userService.getToken()) {
      log.debug("Set authorization header to token")
      return (xhr: JQueryXHR) => {
        if (userService.getToken()) {
          xhr.setRequestHeader(header, `Bearer ${userService.getToken()}`)
        }
      }
    } else if (connection && connection.token) { // TODO: when?
      return (xhr: JQueryXHR) =>
        xhr.setRequestHeader(header, `Bearer ${connection.token}`)
    } else if (connection && connection.username && connection.password) {
      log.debug("Set authorization header to username/password")
      const authInfo = window.btoa(`${connection.username}:${connection.password}`)
      const basicAuthHeader = `Basic ${authInfo}`
      return (xhr: JQueryXHR) => xhr.setRequestHeader(header, basicAuthHeader)
    } else {
      const token = getCookie('XSRF-TOKEN')
      if (token) {
        // For CSRF protection with Spring Security
        log.debug("Set XSRF token header from cookies")
        return (xhr: JQueryXHR) => xhr.setRequestHeader('X-XSRF-TOKEN', token)
      } else {
        log.debug("Not set any authorization header")
        return () => { /* no-op */ }
      }
    }
  }

  private ajaxError(): IAjaxErrorFn {
    const errorThreshold = 2
    let errorCount = 0
    return (xhr: JQueryXHR) => {
      switch (xhr.status) {
        case 401:
        case 403: {
          const url = new URL(window.location.href)
          // If window was opened to connect to remote Jolokia endpoint
          if (url.searchParams.has(PARAM_KEY_CONNECTION)) {
            // ... and not showing the login modal
            if (url.pathname !== '/connect/login') {
              this.jolokia.then(jolokia => jolokia.stop())
              const redirectUrl = window.location.href
              url.pathname = '/connect/login'
              url.searchParams.append('redirect', redirectUrl)
              window.location.href = url.href
            }
          } else {
            // just logout
            if (userService.isLogin()) {
              userService.logout()
            }
          }
          break
        }
        default: {
          errorCount++
          const updateRate = this.loadUpdateRate()
          const validityPeriod = updateRate * (errorThreshold + 1)
          setTimeout(() => errorCount--, validityPeriod)
          if (errorCount > errorThreshold) {
            // TODO: how to notify
            //Core.notification('danger', 'Connection lost. Retrying...', updateRate)
          }
        }
      }
    }
  }

  /**
   * Queries available server-side MBean to check if we can call optimised `jolokia.list()`
   * operation.
   *
   * @param jolokia Jolokia instance to use
   */
  private async checkListOptimisation(jolokia: IJolokia): Promise<void> {
    log.debug("Check if we can call optimised jolokia.list() operation")
    return new Promise<void>((resolve) => {
      jolokia.list(escapeMBeanPath(this.config.mbean), onListSuccess(
        (value: IJmxDomains | IJmxDomain | IJmxMBean) => {
          // check if the MBean exists by testing whether the returned value has
          // the 'op' property
          if (isObject(value?.op)) {
            this.config.method = JolokiaListMethod.OPTIMISED
          } else {
            // we could get 403 error, mark the method as special case,
            // which equals LIST=GENERAL in practice
            this.config.method = JolokiaListMethod.UNDETERMINED
          }
          log.debug("Jolokia list method:", this.config.method)
          resolve()
        }
      ))
    })
  }

  private async loadJolokiaOptions(): Promise<IOptions> {
    let opts = { ...DEFAULT_JOLOKIA_OPTIONS }
    const stored = localStorage.getItem(STORAGE_KEY_JOLOKIA_OPTIONS)
    if (stored) {
      opts = Object.assign(opts, JSON.parse(stored))
    }
    const jolokiaUrl = await this.jolokiaUrl
    if (jolokiaUrl) {
      opts.url = jolokiaUrl
    }
    return opts
  }

  async getJolokiaUrl(): Promise<string | null> {
    return this.jolokiaUrl
  }

  saveJolokiaOptions(params: IOptions) {
    localStorage.setItem(STORAGE_KEY_JOLOKIA_OPTIONS, JSON.stringify(params))
  }

  loadUpdateRate(): number {
    const updateRate = localStorage.getItem(STORAGE_KEY_UPDATE_RATE)
    return updateRate ? parseInt(updateRate) : DEFAULT_UPDATE_RATE
  }

  saveUpdateRate(updateRate: number) {
    localStorage.setItem(STORAGE_KEY_UPDATE_RATE, String(updateRate))
  }
}

type JQueryBeforeSend = (this: unknown, jqXHR: JQueryXHR, settings: unknown) => false | void

/**
 * Dummy Jolokia implementation that does nothing.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
class DummyJolokia implements IJolokia {
  isDummy = true;
  private running = false;

  request(...args: unknown[]) { return null }

  getAttribute(mbean: string, attribute: string, path?: string | ISimpleOptions, opts?: ISimpleOptions) { return null }
  setAttribute(mbean: string, attribute: string, value: unknown, path?: string | ISimpleOptions, opts?: ISimpleOptions) { /* no-op */ }

  execute(mbean: string, operation: string, ...args: unknown[]) {
    args?.forEach(arg =>
      is(arg, object({ success: func() })) && arg.success?.(null))
    return null
  }
  search(mBeanPattern: string, opts?: ISearchOptions) { return null }
  list(path: string, opts?: IListOptions) {
    opts?.success?.({})
    return null
  }
  version(opts?: IVersionOptions) { return ({} as IVersion) }

  register(params: unknown, ...request: unknown[]) { return 0 }
  unregister(handle: number) { /* no-op */ }
  jobs() { return [] }
  start(period: number) { this.running = true }
  stop() { this.running = false }
  isRunning() { return this.running }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

export const jolokiaService = new JolokiaService()
