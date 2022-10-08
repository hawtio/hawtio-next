import { userService } from '@hawtio/auth'
import { getCookie } from '@hawtio/util/cookies'
import { escapeMBeanPath, options } from '@hawtio/util/jolokia'
import { isObject } from '@hawtio/util/objects'
import Jolokia, { IJolokia, IParams, IResponse, IVersion } from 'jolokia.js'
import { connectService, PARAM_KEY_CONNECTION } from './connect-service'
import { Connection } from './connections'

const log = console

const DEFAULT_MAX_DEPTH = 7
const DEFAULT_MAX_COLLECTION_SIZE = 50000
const DEFAULT_JOLOKIA_PARAMS: IParams = {
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
  // constant meaning that general LIST+EXEC Jolokia operations should be used
  LIST_GENERAL = "list",
  // constant meaning that optimized hawtio:type=security,name=RBACRegistry may be used
  LIST_OPTIMISED = "list_optimised",
  // when we get this status, we have to try checking again after logging in
  LIST_CANT_DETERMINE = "cant_determine"
}

export interface JolokiaStatus {
  listMethod: JolokiaListMethod
  listMBean: string
}

/**
 * This is really a MBean that provides an optimised Jolokia list operation,
 * with optionally decorated RBAC info on the result.
 */
const OPTIMISED_JOLOKIA_LIST_MBEAN = "hawtio:type=security,name=RBACRegistry"

export const STORAGE_KEY_JOLOKIA_PARAMS = 'jolokiaParams'
export const STORAGE_KEY_UPDATE_RATE = 'jolokiaUpdateRate'

class JolokiaService {
  private jolokiaUrl: string | null = null
  private jolokia: IJolokia | null = null
  private status: JolokiaStatus = {
    listMethod: JolokiaListMethod.LIST_GENERAL,
    listMBean: OPTIMISED_JOLOKIA_LIST_MBEAN,
  }

  constructor() {
    const init = async () => {
      await this.initJolokiaUrl()
      this.jolokia = this.createJolokia()
    }
    init()
  }

  private async initJolokiaUrl() {
    const url = new URL(window.location.href)
    const searchParams = url.searchParams
    log.debug("Checking search params:", searchParams.toString())

    // Check remote connection from URL query param
    const conn = searchParams.get(PARAM_KEY_CONNECTION)
    if (conn) {
      // Remote connection
      log.debug('Connection name', conn, 'provided, not discovering Jolokia')
      this.jolokiaUrl = connectService.getJolokiaUrlFromName(conn)
      return
    }

    // Discover Jolokia
    for (const path of JOLOKIA_PATHS) {
      log.debug("Checking Jolokia path:", path)
      try {
        this.jolokiaUrl = await this.probe(path)
        break
      } catch (e) {
        // ignore
      }
    }
  }

  private probe(path: string): Promise<string> {
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
            log.error('Error parsing returned data:', e)
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
          reject()
        })
    })
  }

  private createJolokia(): IJolokia {
    if (!this.jolokiaUrl) {
      log.debug("Use dummy Jolokia")
      return new DummyJolokia()
    }

    // TODO: hawtio-oauth may have already set up jQuery beforeSend?
    if (!$.ajaxSettings.beforeSend) {
      log.debug("Set up jQuery beforeSend")
      $.ajaxSetup({ beforeSend: this.beforeSend() })
    }

    const jolokiaParams = this.loadJolokiaParams()
    if (!jolokiaParams.ajaxError) {
      jolokiaParams.ajaxError = this.ajaxError()
    }

    const jolokia = new Jolokia(jolokiaParams)
    jolokia.stop()

    // let's check if we can call faster jolokia.list()
    this.checkJolokiaOptimisation(jolokia)

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

  private ajaxError(): JQueryAjaxError {
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
              this.jolokia?.stop()
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
  private checkJolokiaOptimisation(jolokia: IJolokia) {
    log.debug("Checking if we can call optimized jolokia.list() operation")
    jolokia.list(escapeMBeanPath(this.status.listMBean), options(
      (response: IResponse) => {
        if (isObject(response?.value?.op)) {
          this.status.listMethod = JolokiaListMethod.LIST_OPTIMISED
        } else {
          // we could get 403 error, mark the method as special case, equal in practice with LIST_GENERAL
          this.status.listMethod = JolokiaListMethod.LIST_CANT_DETERMINE
        }
        log.debug("Jolokia list method:", this.status.listMethod)
      }
    ))
  }

  getJolokiaUrl(): string {
    return this.jolokiaUrl ? this.jolokiaUrl : ''
  }

  loadJolokiaParams(): IParams {
    let params = { ...DEFAULT_JOLOKIA_PARAMS }
    const stored = localStorage.getItem(STORAGE_KEY_JOLOKIA_PARAMS)
    if (stored) {
      params = Object.assign(params, JSON.parse(stored))
    }
    params.url = this.getJolokiaUrl()
    return params
  }

  saveJolokiaParams(params: IParams) {
    localStorage.setItem(STORAGE_KEY_JOLOKIA_PARAMS, JSON.stringify(params))
  }

  loadUpdateRate(): number {
    const updateRate = localStorage.getItem(STORAGE_KEY_UPDATE_RATE)
    return updateRate ? parseInt(updateRate) : DEFAULT_UPDATE_RATE
  }

  saveUpdateRate(updateRate: number) {
    localStorage.setItem(STORAGE_KEY_UPDATE_RATE, String(updateRate))
  }
}

type JQueryAjaxError = ((xhr: JQueryXHR, text: string, error: string) => void) | undefined
type JQueryBeforeSend = (this: unknown, jqXHR: JQueryXHR, settings: unknown) => false | void

/**
 * Dummy Jolokia implementation that does nothing.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
class DummyJolokia implements IJolokia {
  isDummy = true;
  private running = false;

  request(...args: unknown[]) { return null }

  getAttribute(mbean: string, attribute: string, path?: string | IParams, opts?: IParams) { return null }
  setAttribute(mbean: string, attribute: string, value: unknown, path?: string | IParams, opts?: IParams) { /* no-op */ }

  execute(mbean: string, operation: string, ...args: unknown[]) { return null }
  search(mBeanPattern: string, opts?: IParams) { return null }
  list(path: string, opts?: IParams) { return null }
  version(opts?: IParams) { return ({} as IVersion) }

  register(params: unknown, ...request: unknown[]) { return 0 }
  unregister(handle: number) { /* no-op */ }
  jobs() { return [] }
  start(period: number) { this.running = true }
  stop() { this.running = false }
  isRunning() { return this.running }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

export const jolokiaService = new JolokiaService()
