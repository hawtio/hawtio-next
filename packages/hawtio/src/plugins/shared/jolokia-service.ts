import { userService } from '@hawtiosrc/auth'
import { eventService, hawtio } from '@hawtiosrc/core'
import { basicAuthHeaderValue, getCookie } from '@hawtiosrc/util/https'
import {
  escapeMBeanPath,
  onBulkSuccessAndError,
  onExecuteSuccessAndError,
  onListSuccessAndError,
  onSearchSuccessAndError,
  onSuccessAndError,
  onVersionSuccessAndError,
} from '@hawtiosrc/util/jolokia'
import { isObject, isString } from '@hawtiosrc/util/objects'
import { parseBoolean } from '@hawtiosrc/util/strings'
import Jolokia, {
  AttributeRequestOptions,
  BaseRequestOptions,
  ErrorResponse,
  ListRequestOptions,
  ListResponse,
  NotificationMode,
  NotificationOptions,
  Request,
  RequestOptions,
  Response,
  SearchRequestOptions,
  VersionRequestOptions,
  VersionResponse,
} from 'jolokia.js'
import 'jolokia.js/simple'
import $ from 'jquery'
import { func, is, object, type } from 'superstruct'
import {
  PARAM_KEY_CONNECTION,
  PARAM_KEY_REDIRECT,
  connectService,
  SESSION_KEY_CURRENT_CONNECTION,
} from '../shared/connect-service'
import { log } from './globals'
import { OptimisedJmxDomains, OptimisedMBeanInfo, isJmxDomain, isJmxDomains, isMBeanInfo } from './tree'

export const DEFAULT_MAX_DEPTH = 7
export const DEFAULT_MAX_COLLECTION_SIZE = 50000
const DEFAULT_JOLOKIA_OPTIONS: RequestOptions = {
  method: 'post',
  mimeType: 'application/json',
  maxCollectionSize: DEFAULT_MAX_COLLECTION_SIZE,
  maxDepth: DEFAULT_MAX_DEPTH,
  canonicalNaming: false,
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

const JOLOKIA_LIST_MAX_DEPTH = 9

export type OptimisedListResponse = {
  cache: OptimisedMBeanInfoCache
  domains: CacheableOptimisedJmxDomains
}
function isOptimisedListResponse(value: unknown): value is OptimisedListResponse {
  return is(value, object({ cache: object(), domains: object() }))
}
export type OptimisedMBeanInfoCache = Record<string, OptimisedMBeanInfo>
export type CacheableOptimisedJmxDomains = Record<string, CacheableOptimisedJmxDomain>
export type CacheableOptimisedJmxDomain = Record<string, OptimisedMBeanInfo | string>

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

type JQueryBeforeSend = (this: unknown, jqXHR: JQueryXHR, settings: unknown) => false | void
type JQueryAjaxError = (xhr: JQueryXHR, text: string, error: string) => void
type AjaxErrorResolver = () => void

export type AttributeValues = Record<string, unknown>

export interface IJolokiaService {
  reset(): void
  getJolokiaUrl(): Promise<string | null>
  getJolokia(): Promise<Jolokia>
  getListMethod(): Promise<JolokiaListMethod>
  getFullJolokiaUrl(): Promise<string>
  list(options?: ListRequestOptions): Promise<OptimisedJmxDomains>
  sublist(paths: string | string[], options?: ListRequestOptions): Promise<OptimisedJmxDomains>
  readAttributes(mbean: string): Promise<AttributeValues>
  readAttribute(mbean: string, attribute: string): Promise<unknown>
  execute(mbean: string, operation: string, args?: unknown[]): Promise<unknown>
  search(mbeanPattern: string): Promise<string[]>
  bulkRequest(requests: Request[]): Promise<Response[]>
  register(request: Request, callback: (response: Response | ErrorResponse) => void): Promise<number>
  unregister(handle: number): void
  loadUpdateRate(): number
  saveUpdateRate(value: number): void
  loadAutoRefresh(): boolean
  saveAutoRefresh(value: boolean): void
  loadJolokiaStoredOptions(): JolokiaStoredOptions
  saveJolokiaStoredOptions(options: JolokiaStoredOptions): void
}

class JolokiaService implements IJolokiaService {
  private jolokiaUrl?: Promise<string | null>
  private jolokia?: Promise<Jolokia>
  private config: JolokiaConfig = {
    method: JolokiaListMethod.DEFAULT,
    mbean: OPTIMISED_JOLOKIA_LIST_MBEAN,
  }

  reset() {
    this.jolokiaUrl = undefined
    this.jolokia = undefined
    this.config = {
      method: JolokiaListMethod.DEFAULT,
      mbean: OPTIMISED_JOLOKIA_LIST_MBEAN,
    }
  }

  /**
   * Get the Jolokia URL that the service is connected to.
   *
   * The URL may not be a full URL including origin (`http(s)://host:port`).
   * It can be a path relative to the root (`/hawtio/jolokia`) or to the current
   * path (`jolokia`).
   *
   * @see Use {@link getFullJolokiaUrl} for getting the full URL.
   */
  getJolokiaUrl(): Promise<string | null> {
    if (this.jolokiaUrl) {
      return this.jolokiaUrl
    }

    this.jolokiaUrl = this.initJolokiaUrl()
    return this.jolokiaUrl
  }

  getJolokia(): Promise<Jolokia> {
    if (this.jolokia) {
      return this.jolokia
    }

    // Initialising Jolokia instance
    this.jolokia = this.createJolokia(jolokia => {
      // Checking versions
      jolokia.version(
        onVersionSuccessAndError(
          version => {
            log.info('Jolokia version:', { client: jolokia.CLIENT_VERSION, agent: version.agent })
          },
          error => log.error('Failed to fetch Jolokia version:', error),
        ),
      )
      // Start Jolokia
      const updateRate = this.loadUpdateRate()
      jolokia.start(updateRate)
      log.info('Jolokia started with update rate =', updateRate)
    })
    return this.jolokia
  }

  private async initJolokiaUrl(): Promise<string | null> {
    // Wait for resolving user as it may attach credentials to http request headers
    if (!(await userService.isLogin())) {
      throw new Error('User needs to have logged in to use Jolokia service')
    }

    // Check remote connection
    const conn = connectService.getCurrentConnectionId()
    if (conn) {
      log.debug('Connection provided, not discovering Jolokia: con =', conn)
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

    log.debug('No available Jolokia path found')
    return null
  }

  private async tryProbeJolokiaPath(path: string): Promise<string> {
    // in normal scenario, when user is authenticated, there should be server-side session created.
    // thus there's no need to attach "Authorization" header to xhr request (both manually or via native
    // browser popup)
    // TOCHECK: scenarios when there's no server side session (Keycloak, OIDC)
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
              log.debug('Found jolokia agent at:', path, ', version:', resp.value.agent)
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

  private async createJolokia(postCreate?: (jolokia: Jolokia) => void): Promise<Jolokia> {
    const jolokiaUrl = await this.getJolokiaUrl()
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
      // Default ajax error handler
      options.ajaxError = this.ajaxError()
    }

    const jolokia = new Jolokia(options)
    jolokia.stop()

    // https://github.com/hawtio/hawtio-next/issues/832
    // at this stage we didn't call Jolokia yet and first attempt, when the server returns 401/403, we may
    // get native browser popup to enter Basic Auth credentials.
    // ideally we should prevent this dialog, but it's not possible with xhr. only with Fetch API with
    // "credentials:'omit'". for now let's leave as is

    // let's check if we can call faster jolokia.list()
    await this.checkListOptimisation(jolokia)

    // Run any post-create processing that should be done before the resolved
    // Jolokia is returned
    postCreate?.(jolokia)

    return jolokia
  }

  private async beforeSend(): Promise<JQueryBeforeSend> {
    const connection = await connectService.getCurrentConnection()
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

  private ajaxError(resolve?: AjaxErrorResolver): JQueryAjaxError {
    const errorThreshold = 2
    let errorCount = 0
    let errorToastDisplayed = false
    return (xhr: JQueryXHR) => {
      switch (xhr.status) {
        case 401:
        case 403: {
          const url = new URL(window.location.href)
          // If window was opened to connect to remote Jolokia endpoint
          if (url.searchParams.has(PARAM_KEY_CONNECTION) || sessionStorage.getItem(SESSION_KEY_CURRENT_CONNECTION)) {
            // we're in connected tab/window and Jolokia access attempt ended with 401/403
            // because xhr was used we _should_ have seen native browser popup to enter credentials and later
            // to store them in browser's password manager. If user closes this dialog and doesn't enter any valid
            // credentials we should display connect/login page with React dialog which accepts and stores the
            // credentials in sessionStorage using encryption.
            // but this is NOT possible in insecure context where we can't use window.crypto.subtle object
            if (!window.isSecureContext) {
              // this won't work if user manually browses to URL with con=connection-id.
              // there will be "Scripts may not close windows that were not opened by script." warning in console
              window.close()
              return
            }
            const loginPath = connectService.getLoginPath()
            if (url.pathname !== loginPath) {
              // ... and not showing the login modal
              this.jolokia?.then(jolokia => jolokia.stop())
              const redirectUrl = window.location.href
              url.pathname = loginPath
              url.searchParams.append(PARAM_KEY_REDIRECT, redirectUrl)
              // full browser refresh
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
          setTimeout(() => {
            errorCount--
            if (errorCount == 0) {
              errorToastDisplayed = false
            }
            return errorCount
          }, validityPeriod)
          if (errorCount > errorThreshold && !errorToastDisplayed) {
            eventService.notify({
              type: 'danger',
              message: 'Connection lost. Will attempt reconnection...',
              // -100ms is to not overlap between update and notification
              duration: updateRate - 100,
            })
            errorToastDisplayed = true
          }
        }
      }

      // Resolve any waiting promise that might be blocked by the error
      resolve?.()
    }
  }

  /**
   * Queries available server-side MBean to check if we can call optimised `jolokia.list()`
   * operation.
   *
   * @param jolokia Jolokia instance to use
   */
  protected async checkListOptimisation(jolokia: Jolokia): Promise<void> {
    log.debug('Check if we can call optimised jolokia.list() operation')
    return new Promise<void>(resolve => {
      const successFn: NonNullable<ListRequestOptions['success']> = (value: ListResponse) => {
        // check if the MBean exists by testing whether the returned value has
        // the 'op' property
        if (isMBeanInfo(value) && isObject(value.op)) {
          this.config.method = JolokiaListMethod.OPTIMISED
        } else {
          // we could get 403 error, mark the method as special case,
          // which equals LIST=GENERAL in practice
          this.config.method = JolokiaListMethod.UNDETERMINED
        }
        log.debug('Jolokia list method:', JolokiaListMethod[this.config.method])
        resolve()
      }

      const errorFn: NonNullable<ListRequestOptions['error']> = (response: ErrorResponse) => {
        log.debug('Operation "list" failed due to:', response.error)
        log.debug('Optimisation on jolokia.list() not available')
        resolve() // optimisation not happening
      }

      jolokia.list(
        escapeMBeanPath(this.config.mbean),
        onListSuccessAndError(successFn, errorFn, { ajaxError: this.ajaxError(resolve) }),
      )
    })
  }

  private async loadJolokiaOptions(): Promise<BaseRequestOptions> {
    const opts = { ...DEFAULT_JOLOKIA_OPTIONS, ...this.loadJolokiaStoredOptions() }

    const jolokiaUrl = await this.getJolokiaUrl()
    if (jolokiaUrl) {
      opts.url = jolokiaUrl
    }
    return opts
  }

  /**
   * Get the full Jolokia URL that the service is connected to.
   *
   * The origin part (`http(s)://host:port`) is resolved based on `window.location`.
   *
   * @see {@link getJolokiaUrl}
   */
  async getFullJolokiaUrl(): Promise<string> {
    const jolokiaUrl = (await this.getJolokiaUrl()) ?? ''
    if (jolokiaUrl.match(/^https?:\/\//)) {
      return jolokiaUrl
    }

    const { origin } = window.location
    if (jolokiaUrl.startsWith('/')) {
      return `${origin}${jolokiaUrl}`
    }

    const basePath = hawtio.getBasePath() ?? ''
    return `${origin}${basePath}/${jolokiaUrl}`
  }

  async getListMethod(): Promise<JolokiaListMethod> {
    // Need to wait for Jolokia instance as it might update the list method
    await this.getJolokia()
    return this.config.method
  }

  list(options?: ListRequestOptions): Promise<OptimisedJmxDomains> {
    return this.doList([], options)
  }

  sublist(paths: string | string[], options?: ListRequestOptions): Promise<OptimisedJmxDomains> {
    return this.doList(Array.isArray(paths) ? paths : [paths], options)
  }

  private async doList(paths: string[], options: ListRequestOptions = {}): Promise<OptimisedJmxDomains> {
    // Granularity of the return value is MBean info and cannot be smaller
    paths.forEach(path => {
      if (path.split('/').length > 2) {
        throw new Error('Path cannot specify children of MBean (attr, op, etc.): ' + path)
      }
    })

    const jolokia = await this.getJolokia()
    if (jolokia.CLIENT_VERSION === 'DUMMY') {
      // For dummy Jolokia client, it's too difficult to properly resolve the promise
      // of complex bulk list request, so shortcut here.
      return {}
    }

    const { method, mbean } = this.config

    const { success, error: errorFn, ajaxError } = options

    return new Promise((resolve, reject) => {
      // Override ajaxError to make sure it terminates in case of ajax error
      options.ajaxError = (xhr, text, error) => {
        ajaxError?.(xhr, text, error)
        reject(error)
      }
      // Overwrite max depth as listing MBeans requires some constant depth to work
      // See: https://github.com/hawtio/hawtio-next/issues/670
      const { maxDepth } = this.loadJolokiaStoredOptions()
      if (maxDepth < JOLOKIA_LIST_MAX_DEPTH) {
        options.maxDepth = JOLOKIA_LIST_MAX_DEPTH
      }
      switch (method) {
        case JolokiaListMethod.OPTIMISED: {
          log.debug('Invoke Jolokia list MBean in optimised mode:', paths)
          const execOptions = onExecuteSuccessAndError(
            value => {
              // For empty or single list, the first path should be enough
              const path = paths?.[0]?.split('/')
              const domains = this.unwindListResponse(value, path)
              success?.(domains)
              resolve(domains)
            },
            error => {
              errorFn?.(error)
              reject(error)
            },
            options as BaseRequestOptions,
          )
          if (paths.length === 0) {
            jolokia.execute(mbean, 'list()', execOptions)
          } else if (paths.length === 1) {
            jolokia.execute(mbean, 'list(java.lang.String)', paths[0], execOptions)
          } else {
            // Bulk request and merge the result
            const requests: Request[] = paths.map(path => ({
              type: 'exec',
              mbean,
              operation: 'list(java.lang.String)',
              arguments: [path],
              config: execOptions,
            }))
            this.bulkList(jolokia, requests, execOptions)
          }
          break
        }
        case JolokiaListMethod.DEFAULT:
        case JolokiaListMethod.UNDETERMINED:
        default: {
          log.debug('Invoke Jolokia list MBean in default mode:', paths)
          const listOptions = onListSuccessAndError(
            value => {
              // For empty or single list, the first path should be enough
              const path = paths?.[0]?.split('/')
              const domains = this.unwindListResponse(value, path)
              success?.(domains)
              resolve(domains)
            },
            error => {
              errorFn?.(error)
              reject(error)
            },
            options,
          )
          if (paths.length === 0) {
            jolokia.list(listOptions)
          } else if (paths.length === 1) {
            jolokia.list(paths[0] ?? '', listOptions)
          } else {
            // Bulk request and merge the result
            const requests: Request[] = paths.map(path => ({ type: 'list', path, config: listOptions }))
            this.bulkList(jolokia, requests, listOptions)
          }
        }
      }
    })
  }

  /**
   * Detects whether the given response comes from optimised or default list and
   * restores its shape to the standard list response of type {@link OptimisedJmxDomains}.
   *
   * @param response response value from Jolokia LIST
   * @param path optional path information to restore the response to {@link OptimisedJmxDomains}
   */
  unwindListResponse(response: unknown, path?: string[]): OptimisedJmxDomains {
    if (isOptimisedListResponse(response)) {
      // Post process cached MBean info
      const { cache, domains } = response
      Object.entries(domains).forEach(([_, domain]) => {
        Object.entries(domain).forEach(([mbeanName, mbeanOrCache]) => {
          if (isString(mbeanOrCache)) {
            domain[mbeanName] = cache[mbeanOrCache] as OptimisedMBeanInfo
          }
        })
      })
      return domains as OptimisedJmxDomains
    }

    if (isJmxDomains(response)) {
      return response
    }

    if (isJmxDomain(response)) {
      const domain = path?.[0]
      if (!domain) {
        throw new Error('Domain must be provided: ' + path)
      }
      return { [domain]: response }
    }

    if (isMBeanInfo(response)) {
      const domain = path?.[0]
      const mbean = path?.[1]
      if (!domain || !mbean) {
        throw new Error('Domain/property list must be provided: ' + path)
      }
      return { [domain]: { [mbean]: response } }
    }

    throw new Error('Unexpected Jolokia list response: ' + JSON.stringify(response))
  }

  private bulkList(jolokia: Jolokia, requests: Request[], listOptions: ListRequestOptions) {
    const bulkResponse: Response[] = []
    const mergeResponses = () => {
      const domains = bulkResponse
        .filter(response => {
          if (response.status === 200) {
            return true
          } else {
            const error = response as ErrorResponse
            log.warn('Bulk list response error:', error.error)
            return false
          }
        })
        .map(response => {
          switch (response.request.type) {
            case 'list': {
              const path = response.request.path?.split('/')
              return this.unwindListResponse(response.value, path)
            }
            case 'exec': {
              const path = response.request.arguments as string[]
              return this.unwindListResponse(response.value, path)
            }
            default:
              return this.unwindListResponse(response.value)
          }
        })
        .reduce((merged, response) => this.mergeDomains(response, merged), {})
      listOptions.success?.(domains)
    }
    jolokia.request(
      requests,
      onBulkSuccessAndError(
        response => {
          bulkResponse.push(response)
          // Resolve only when all the responses from the bulk request are collected
          if (bulkResponse.length === requests.length) {
            mergeResponses()
          }
        },
        error => {
          log.error('Error during bulk list:', error)
          bulkResponse.push(error)
          // Resolve only when all the responses from the bulk request are collected
          if (bulkResponse.length === requests.length) {
            mergeResponses()
          }
        },
        // Reuse the list options other than success and error functions
        listOptions as BaseRequestOptions,
      ),
    )
  }

  private mergeDomains(source: OptimisedJmxDomains, target: OptimisedJmxDomains): OptimisedJmxDomains {
    Object.entries(source).forEach(([domainName, domain]) => {
      const targetDomain = target[domainName]
      if (targetDomain) {
        Object.entries(domain).forEach(([mbeanName, mbean]) => {
          // Latter always overrides former
          targetDomain[mbeanName] = mbean
        })
      } else {
        target[domainName] = domain
      }
    })
    return target
  }

  async readAttributes(mbean: string): Promise<AttributeValues> {
    const jolokia = await this.getJolokia()
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
    const jolokia = await this.getJolokia()
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
    const jolokia = await this.getJolokia()
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
    const jolokia = await this.getJolokia()
    return new Promise((resolve, reject) => {
      jolokia.execute(
        mbean,
        operation,
        ...args,
        onExecuteSuccessAndError(
          response => resolve(response),
          error => reject(error.stacktrace || error.error),
        ),
      )
    })
  }

  async search(mbeanPattern: string): Promise<string[]> {
    const jolokia = await this.getJolokia()
    return new Promise(resolve => {
      jolokia.search(
        mbeanPattern,
        onSearchSuccessAndError(
          response => resolve(response as string[]),
          error => {
            log.error('Error during search:', error)
            resolve([])
          },
        ),
      )
    })
  }

  async bulkRequest(requests: Request[]): Promise<Response[]> {
    const jolokia = await this.getJolokia()
    return new Promise(resolve => {
      const bulkResponse: Response[] = []
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
            bulkResponse.push(error)
            // Resolve only when all the responses from the bulk request are collected
            if (bulkResponse.length === requests.length) {
              resolve(bulkResponse)
            }
          },
        ),
      )
    })
  }

  async register(request: Request, callback: (response: Response) => void): Promise<number> {
    const jolokia = await this.getJolokia()
    return jolokia.register(callback, request)
  }

  async unregister(handle: number) {
    const jolokia = await this.getJolokia()
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
    const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH
    const maxCollectionSize = options.maxCollectionSize ?? DEFAULT_MAX_COLLECTION_SIZE
    return { maxDepth, maxCollectionSize }
  }

  saveJolokiaStoredOptions(options: JolokiaStoredOptions) {
    localStorage.setItem(STORAGE_KEY_JOLOKIA_OPTIONS, JSON.stringify(options))
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Dummy Jolokia implementation that does nothing.
 */
class DummyJolokia implements Jolokia {
  CLIENT_VERSION = 'DUMMY'
  isDummy = true
  private running = false

  request(...args: unknown[]) {
    return null
  }

  getAttribute(
    mbean: string,
    attribute: string,
    path?: string | AttributeRequestOptions,
    opts?: AttributeRequestOptions,
  ) {
    if (typeof path !== 'string') {
      path?.success?.({})
    }
    opts?.success?.({})
    return null
  }
  setAttribute(
    mbean: string,
    attribute: string,
    value: unknown,
    path?: string | AttributeRequestOptions,
    opts?: AttributeRequestOptions,
  ) {
    if (typeof path !== 'string') {
      path?.success?.({})
    }
    opts?.success?.({})
  }

  execute(mbean: string, operation: string, ...args: unknown[]) {
    args?.forEach(arg => is(arg, type({ success: func() })) && arg.success(null))
    return null
  }
  search(mbeanPattern: string, opts?: SearchRequestOptions) {
    opts?.success?.([])
    return null
  }
  list(path?: string | string[] | ListRequestOptions, opts?: ListRequestOptions) {
    if (typeof path !== 'string' && !Array.isArray(path)) {
      path?.success?.({})
    }
    opts?.success?.({})
    return null
  }
  version(opts?: VersionRequestOptions) {
    opts?.success?.({} as VersionResponse)
    return {} as VersionResponse
  }

  register(params: unknown, ...request: unknown[]) {
    return 0
  }
  unregister(handle: number) {
    // no-op
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

  addNotificationListener(opts: NotificationOptions) {
    // no-op
  }
  removeNotificationListener(handle: { id: string; mode: NotificationMode }) {
    // no-op
  }
  unregisterNotificationClient() {
    // no-op
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

export const jolokiaService = new JolokiaService()
