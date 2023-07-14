import { userService } from '@hawtiosrc/auth'
import { eventService } from '@hawtiosrc/core'
import { basicAuthHeaderValue, getCookie } from '@hawtiosrc/util/https'
import {
  escapeMBeanPath,
  onBulkSuccessAndError,
  onListSuccessAndError,
  onSimpleSuccessAndError,
  onSuccessAndError,
} from '@hawtiosrc/util/jolokia'
import { isObject } from '@hawtiosrc/util/objects'
import { parseBoolean } from '@hawtiosrc/util/strings'
import Jolokia, {
  IAjaxErrorFn,
  IErrorResponse,
  IErrorResponseFn,
  IJmxDomain,
  IJmxDomains,
  IJmxMBean,
  IJolokia,
  IListOptions,
  IListResponseFn,
  IOptions,
  IRequest,
  IResponse,
  IResponseFn,
  ISearchOptions,
  ISimpleOptions,
  IVersion,
  IVersionOptions,
} from 'jolokia.js'
import 'jolokia.js/jolokia-simple'
import $ from 'jquery'
import { func, is, object } from 'superstruct'
import { PARAM_KEY_CONNECTION, connectService } from '../shared/connect-service'
import { log } from './globals'

export const DEFAULT_MAX_DEPTH = 7
export const DEFAULT_MAX_COLLECTION_SIZE = 50000
const DEFAULT_JOLOKIA_OPTIONS: IOptions = {
  method: 'POST',
  mimeType: 'application/json',
  maxCollectionSize: DEFAULT_MAX_COLLECTION_SIZE,
  maxDepth: DEFAULT_MAX_DEPTH,
  canonicalNaming: false,
  canonicalProperties: false,
  ignoreErrors: true,
} as const

export const DEFAULT_UPDATE_RATE = 5000
export const DEFAULT_AUTO_REFRESH = false

const JOLOKIA_PATHS = ['jolokia', '/hawtio/jolokia', '/jolokia'] as const

export enum JolokiaListMethod {
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
const OPTIMISED_JOLOKIA_LIST_MBEAN = 'hawtio:type=security,name=RBACRegistry'

const OPTIMISED_JOLOKIA_LIST_MAX_DEPTH = 9

export type JolokiaConfig = {
  method: JolokiaListMethod
  mbean: string
}

export type JolokiaStoredOptions = {
  maxDepth: number
  maxCollectionSize: number
}

export const STORAGE_KEY_JOLOKIA_OPTIONS = 'connect.jolokia.options'
export const STORAGE_KEY_UPDATE_RATE = 'connect.jolokia.updateRate'
export const STORAGE_KEY_AUTO_REFRESH = 'connect.jolokia.autoRefresh'

export interface IJolokiaService {
  getJolokiaUrl(): Promise<string | null>
  getListMethod(): Promise<JolokiaListMethod>
  list(options: ISimpleOptions): Promise<unknown>
  readAttributes(mbean: string): Promise<AttributeValues>
  readAttribute(mbean: string, attribute: string): Promise<unknown>
  execute(mbean: string, operation: string, args?: unknown[]): Promise<unknown>
  search(mbeanPattern: string): Promise<string[]>
  bulkRequest(requests: IRequest[]): Promise<IResponse[]>
  register(request: IRequest, callback: IResponseFn): Promise<number>
  unregister(handle: number): void
  loadUpdateRate(): number
  saveUpdateRate(value: number): void
  loadAutoRefresh(): boolean
  saveAutoRefresh(value: boolean): void
  loadJolokiaStoredOptions(): JolokiaStoredOptions
  saveJolokiaStoredOptions(options: JolokiaStoredOptions): void
}

class JolokiaService implements IJolokiaService {
  private jolokiaUrl: Promise<string | null>
  private jolokia: Promise<IJolokia>
  private config: JolokiaConfig = {
    method: JolokiaListMethod.DEFAULT,
    mbean: OPTIMISED_JOLOKIA_LIST_MBEAN,
  }

  constructor() {
    this.jolokiaUrl = this.initJolokiaUrl()
    this.jolokia = this.createJolokia()

    // Start Jolokia
    this.jolokia.then(jolokia => {
      const updateRate = this.loadUpdateRate()
      jolokia.start(updateRate)
      log.info('Jolokia started with update rate =', updateRate)
    })
  }

  private async initJolokiaUrl(): Promise<string | null> {
    // Wait for resolving user as it may attach credentials to http request headers
    await userService.isLogin()

    // Check remote connection
    const conn = connectService.getCurrentConnectionName()
    if (conn) {
      log.debug('Connection name', conn, 'provided, not discovering Jolokia')
      return connectService.getJolokiaUrlFromName(conn)
    }

    // Discover Jolokia
    for (const path of JOLOKIA_PATHS) {
      log.debug('Checking Jolokia path:', path)
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
            log.debug('Using URL:', path, 'assuming it could be an agent but got return code:', xhr.status)
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
      log.debug('Use dummy Jolokia')
      return new DummyJolokia()
    }

    // An auth plugin such as Keycloak may have already set up jQuery beforeSend
    if (!$.ajaxSettings.beforeSend) {
      log.debug('Set up jQuery beforeSend')
      const beforeSend = await this.beforeSend()
      $.ajaxSetup({ beforeSend })
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

  private async beforeSend(): Promise<JQueryBeforeSend> {
    const connection = connectService.getCurrentConnection()
    // Just set Authorization for now...
    const header = 'Authorization'
    if ((await userService.isLogin()) && userService.getToken()) {
      log.debug('Set authorization header to token')
      return (xhr: JQueryXHR) => {
        if (userService.getToken()) {
          xhr.setRequestHeader(header, `Bearer ${userService.getToken()}`)
        }
      }
    } else if (connection && connection.token) {
      // TODO: when?
      return (xhr: JQueryXHR) => xhr.setRequestHeader(header, `Bearer ${connection.token}`)
    } else if (connection && connection.username && connection.password) {
      log.debug('Set authorization header to username/password')
      const headerValue = basicAuthHeaderValue(connection.username, connection.password)
      return (xhr: JQueryXHR) => xhr.setRequestHeader(header, headerValue)
    } else {
      const token = getCookie('XSRF-TOKEN')
      if (token) {
        // For CSRF protection with Spring Security
        log.debug('Set XSRF token header from cookies')
        return (xhr: JQueryXHR) => xhr.setRequestHeader('X-XSRF-TOKEN', token)
      } else {
        log.debug('Not set any authorization header')
        return () => {
          /* no-op */
        }
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
            userService.isLogin().then(login => {
              log.debug('Logging out due to jQuery ajax error: status =', xhr.status)
              login && userService.logout()
            })
          }
          break
        }
        default: {
          errorCount++
          const updateRate = this.loadUpdateRate()
          const validityPeriod = updateRate * (errorThreshold + 1)
          setTimeout(() => errorCount--, validityPeriod)
          if (errorCount > errorThreshold) {
            eventService.notify({
              type: 'danger',
              message: 'Connection lost. Retrying...',
              // -100ms is to not overlap between update and notification
              duration: updateRate - 100,
            })
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
  protected async checkListOptimisation(jolokia: IJolokia): Promise<void> {
    log.debug('Check if we can call optimised jolokia.list() operation')
    return new Promise<void>(resolve => {
      const successFn: IListResponseFn = (value: IJmxDomains | IJmxDomain | IJmxMBean) => {
        // check if the MBean exists by testing whether the returned value has
        // the 'op' property
        if (isObject(value?.op)) {
          this.config.method = JolokiaListMethod.OPTIMISED
        } else {
          // we could get 403 error, mark the method as special case,
          // which equals LIST=GENERAL in practice
          this.config.method = JolokiaListMethod.UNDETERMINED
        }
        log.debug('Jolokia list method:', JolokiaListMethod[this.config.method])
        resolve()
      }

      const errorFn: IErrorResponseFn = (response: IErrorResponse) => {
        log.debug('Operation "list" failed due to:', response.error)
        log.debug('Optimisation on jolokia.list() not available')
        resolve() // optimisation not happening
      }

      jolokia.list(escapeMBeanPath(this.config.mbean), onListSuccessAndError(successFn, errorFn))
    })
  }

  private async loadJolokiaOptions(): Promise<IOptions> {
    const opts = { ...DEFAULT_JOLOKIA_OPTIONS, ...this.loadJolokiaStoredOptions() }

    const jolokiaUrl = await this.jolokiaUrl
    if (jolokiaUrl) {
      opts.url = jolokiaUrl
    }
    return opts
  }

  getJolokiaUrl(): Promise<string | null> {
    return this.jolokiaUrl
  }

  async getListMethod(): Promise<JolokiaListMethod> {
    return this.config.method
  }

  async list(options: ISimpleOptions): Promise<unknown> {
    const jolokia = await this.jolokia
    const { method, mbean } = this.config

    return new Promise((resolve, reject) => {
      switch (method) {
        case JolokiaListMethod.OPTIMISED:
          log.debug('Invoke Jolokia list MBean in optimised mode')
          // Overwrite max depth as listing MBeans requires some constant depth to work
          options.maxDepth = OPTIMISED_JOLOKIA_LIST_MAX_DEPTH
          jolokia.execute(
            mbean,
            'list()',
            onSimpleSuccessAndError(
              value => resolve(value),
              error => reject(error),
              options,
            ),
          )
          break
        case JolokiaListMethod.DEFAULT:
        case JolokiaListMethod.UNDETERMINED:
        default:
          log.debug('Invoke Jolokia list MBean in default mode')
          jolokia.list(
            null,
            onListSuccessAndError(
              value => resolve(value),
              error => reject(error),
              options,
            ),
          )
      }
    })
  }

  async readAttributes(mbean: string): Promise<AttributeValues> {
    const jolokia = await this.jolokia
    return new Promise(resolve => {
      jolokia.request(
        { type: 'read', mbean },
        onSuccessAndError(
          response => resolve(response.value as AttributeValues),
          error => {
            log.error('Error during readAttributes:', error)
            resolve({})
          },
        ),
      )
    })
  }

  async readAttribute(mbean: string, attribute: string): Promise<unknown> {
    const jolokia = await this.jolokia
    return new Promise(resolve => {
      jolokia.request(
        { type: 'read', mbean, attribute },
        onSuccessAndError(
          response => resolve(response.value as unknown),
          error => {
            log.error('Error during readAttribute:', error)
            resolve(null)
          },
        ),
      )
    })
  }

  async writeAttribute(mbean: string, attribute: string, value: unknown): Promise<unknown> {
    const jolokia = await this.jolokia
    return new Promise(resolve => {
      jolokia.request(
        { type: 'write', mbean, attribute, value },
        onSuccessAndError(
          response => resolve(response.value as unknown),
          error => {
            log.error('Error during writeAttribute:', error)
            resolve(null)
          },
        ),
      )
    })
  }

  async execute(mbean: string, operation: string, args: unknown[] = []): Promise<unknown> {
    const jolokia = await this.jolokia
    return new Promise((resolve, reject) => {
      jolokia.execute(
        mbean,
        operation,
        ...args,
        onSimpleSuccessAndError(
          response => resolve(response),
          error => reject(error.stacktrace || error.error),
        ),
      )
    })
  }

  async search(mbeanPattern: string): Promise<string[]> {
    const jolokia = await this.jolokia
    return new Promise(resolve => {
      jolokia.search(
        mbeanPattern,
        onSimpleSuccessAndError(
          response => resolve(response as string[]),
          error => {
            log.error('Error during search:', error)
            resolve([])
          },
        ),
      )
    })
  }

  async bulkRequest(requests: IRequest[]): Promise<IResponse[]> {
    const jolokia = await this.jolokia
    return new Promise(resolve => {
      const bulkResponse: IResponse[] = []
      jolokia.request(
        requests,
        onBulkSuccessAndError(
          response => {
            bulkResponse.push(response)
            // Resolve only when all the responses from the bulk request are collected
            if (bulkResponse.length === requests.length) {
              resolve(bulkResponse)
            }
          },
          error => {
            log.error('Error during bulkRequest:', error)
            resolve(bulkResponse)
          },
        ),
      )
    })
  }

  async register(request: IRequest, callback: IResponseFn): Promise<number> {
    const jolokia = await this.jolokia
    return jolokia.register(callback, request)
  }

  async unregister(handle: number) {
    const jolokia = await this.jolokia
    jolokia.unregister(handle)
  }

  loadUpdateRate(): number {
    const value = localStorage.getItem(STORAGE_KEY_UPDATE_RATE)
    return value ? parseInt(JSON.parse(value)) : DEFAULT_UPDATE_RATE
  }

  saveUpdateRate(value: number): void {
    localStorage.setItem(STORAGE_KEY_UPDATE_RATE, JSON.stringify(value))
  }

  loadAutoRefresh(): boolean {
    const value = localStorage.getItem(STORAGE_KEY_AUTO_REFRESH)
    return value ? parseBoolean(value) : DEFAULT_AUTO_REFRESH
  }

  saveAutoRefresh(value: boolean): void {
    localStorage.setItem(STORAGE_KEY_AUTO_REFRESH, JSON.stringify(value))
  }

  loadJolokiaStoredOptions(): JolokiaStoredOptions {
    const item = localStorage.getItem(STORAGE_KEY_JOLOKIA_OPTIONS)
    const options: JolokiaStoredOptions = item ? JSON.parse(item) : {}
    const maxDepth = options.maxDepth || DEFAULT_MAX_DEPTH
    const maxCollectionSize = options.maxCollectionSize || DEFAULT_MAX_COLLECTION_SIZE
    return { maxDepth, maxCollectionSize }
  }

  saveJolokiaStoredOptions(options: JolokiaStoredOptions) {
    localStorage.setItem(STORAGE_KEY_JOLOKIA_OPTIONS, JSON.stringify(options))
  }
}

type JQueryBeforeSend = (this: unknown, jqXHR: JQueryXHR, settings: unknown) => false | void

export type AttributeValues = { [name: string]: unknown }

/**
 * Dummy Jolokia implementation that does nothing.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
class DummyJolokia implements IJolokia {
  isDummy = true
  private running = false

  request(...args: unknown[]) {
    return null
  }

  getAttribute(mbean: string, attribute: string, path?: string | ISimpleOptions, opts?: ISimpleOptions) {
    opts?.success?.({})
    return null
  }
  setAttribute(
    mbean: string,
    attribute: string,
    value: unknown,
    path?: string | ISimpleOptions,
    opts?: ISimpleOptions,
  ) {
    opts?.success?.({})
  }

  execute(mbean: string, operation: string, ...args: unknown[]) {
    args?.forEach(arg => is(arg, object({ success: func() })) && arg.success?.(null))
    return null
  }
  search(mBeanPattern: string, opts?: ISearchOptions) {
    opts?.success?.([])
    return null
  }
  list(path: string, opts?: IListOptions) {
    opts?.success?.({})
    return null
  }
  version(opts?: IVersionOptions) {
    opts?.success?.({} as IVersion)
    return {} as IVersion
  }

  register(params: unknown, ...request: unknown[]) {
    return 0
  }
  unregister(handle: number) {
    /* no-op */
  }
  jobs() {
    return []
  }
  start(period: number) {
    this.running = true
  }
  stop() {
    this.running = false
  }
  isRunning() {
    return this.running
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

export const jolokiaService = new JolokiaService()

export const __testing_jolokia_service__ = {
  JolokiaService,
  DummyJolokia,
}
