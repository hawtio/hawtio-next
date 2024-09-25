import { userService } from '@hawtiosrc/auth'
import { eventService, hawtio } from '@hawtiosrc/core'
import { basicAuthHeaderValue, getCookie } from '@hawtiosrc/util/https'
import {
  escapeMBeanPath,
  onAttributeSuccessAndError,
  onBulkSuccessAndError,
  onExecuteSuccessAndError,
  onListSuccessAndError,
  onSearchSuccessAndError,
  onVersionSuccessAndError,
} from '@hawtiosrc/util/jolokia'
import { isObject, isString } from '@hawtiosrc/util/objects'
import { parseBoolean } from '@hawtiosrc/util/strings'
import {
  BaseRequestOptions,
  ErrorCallback,
  ExecResponseValue,
  FetchErrorCallback,
  JobCallback,
  JobRegistrationConfig,
  JolokiaErrorResponse,
  JolokiaRequest,
  JolokiaResponse,
  JolokiaResponseValue,
  JolokiaSuccessResponse,
  ListResponseValue,
  NotificationHandle,
  NotificationOptions,
  ReadResponseValue,
  RequestOptions,
  SearchResponseValue,
  VersionResponseValue,
  WriteResponseValue,
} from 'jolokia.js'
import Jolokia, { IJolokiaSimple, SimpleRequestOptions, SimpleResponseCallback } from '@jolokia.js/simple'
import { is, object } from 'superstruct'
import {
  PARAM_KEY_CONNECTION,
  PARAM_KEY_REDIRECT,
  SESSION_KEY_CURRENT_CONNECTION,
  connectService,
} from './connect-service'
import { log } from './globals'
import { OptimisedJmxDomains, OptimisedMBeanInfo, isJmxDomain, isJmxDomains, isMBeanInfo } from './tree'

export const DEFAULT_MAX_DEPTH = 7
export const DEFAULT_MAX_COLLECTION_SIZE = 50000
const DEFAULT_JOLOKIA_OPTIONS: SimpleRequestOptions = {
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
// see https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
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

type AjaxErrorResolver = () => void

/** Narrowed Jolokia ReadResponseValue type - only a record of attribute values */
export type AttributeValues = Record<string, unknown>

/**
 * Jolokia access interface used by Hawtio. Underneath, Jolokia's own {@link IJolokiaSimple} interface is used, but it
 * can also be obtained from this interface, to be used directly.
 */
export interface IJolokiaService {
  // --- Management methods

  reset(): void

  getJolokiaUrl(): Promise<string | null>
  getFullJolokiaUrl(): Promise<string>

  getJolokia(): Promise<IJolokiaSimple>
  getListMethod(): Promise<JolokiaListMethod>

  // --- Methods using Jolokia API (read, write, exec, list, search, version)

  list(options?: SimpleRequestOptions): Promise<OptimisedJmxDomains>
  sublist(paths: string | string[], options?: SimpleRequestOptions): Promise<OptimisedJmxDomains>

  readAttributes(mbean: string, options?: RequestOptions): Promise<AttributeValues>
  readAttribute(mbean: string, attribute: string, options?: RequestOptions): Promise<unknown>
  writeAttribute(mbean: string, attribute: string, value: unknown, options?: RequestOptions): Promise<unknown>

  execute(mbean: string, operation: string, args?: unknown[], options?: SimpleRequestOptions): Promise<unknown>

  search(mbeanPattern: string, options?: SimpleRequestOptions): Promise<string[]>

  bulkRequest(
    requests: JolokiaRequest[],
    options?: RequestOptions,
  ): Promise<(JolokiaSuccessResponse | JolokiaErrorResponse)[]>

  // --- Methods using Jolokia registration API

  register(
    request: JolokiaRequest,
    callback: (response: JolokiaSuccessResponse | JolokiaErrorResponse) => void,
  ): Promise<number>
  unregister(handle: number): void

  // --- Configuration methods

  loadUpdateRate(): number
  saveUpdateRate(value: number): void

  loadAutoRefresh(): boolean
  saveAutoRefresh(value: boolean): void

  loadJolokiaStoredOptions(): JolokiaStoredOptions
  saveJolokiaStoredOptions(options: JolokiaStoredOptions): void
}

// Note: While Jolokia 2.1.0 switches to fetch() API and introduces recommended _promise mode_, we still
// use _callback mode_ as it was before.

class JolokiaService implements IJolokiaService {
  private jolokiaUrl?: Promise<string | null>
  private jolokia?: Promise<IJolokiaSimple>
  private config: JolokiaConfig = {
    method: JolokiaListMethod.DEFAULT,
    mbean: OPTIMISED_JOLOKIA_LIST_MBEAN,
  }

  // --- Management methods

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

  getJolokia(): Promise<IJolokiaSimple> {
    if (this.jolokia) {
      return this.jolokia
    }

    // Initialising Jolokia instance
    this.jolokia = this.createJolokia(jolokia => {
      // Checking versions
      jolokia.version(
        onVersionSuccessAndError(
          (version: JolokiaResponseValue) => {
            log.info('Jolokia version:', {
              client: jolokia.CLIENT_VERSION,
              agent: (version as VersionResponseValue).agent,
            })
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
      fetch(path)
        .then(async (response: Response) => {
          // for fetch(), .then() is fed with any response code, while .catch() is used to handle
          // more serious issues (like connection refused)
          if (response.status == 200) {
            try {
              const resp = await response.json()
              if ('value' in resp && 'agent' in resp.value) {
                log.debug('Found jolokia agent at:', path, ', version:', resp.value.agent)
                resolve(path)
                return
              }
            } catch (e) {
              // Parse error should mean redirect to html
              // this exception could also be handled by removing this try..catch and getting the exception
              // in this promise's .catch() handler
              reject(e)
              return
            }
            reject()
            return
          }
          if (response.status === 401 || response.status === 403) {
            // I guess this could be it...
            log.debug('Using URL:', path, 'assuming it could be an agent but got return code:', response.status)
            resolve(path)
            return
          }
          reject()
          return
        })
        .catch(error => {
          reject(error)
          return
        })
    })
  }

  private async createJolokia(postCreate?: (jolokia: IJolokiaSimple) => void): Promise<IJolokiaSimple> {
    const jolokiaUrl = await this.getJolokiaUrl()
    if (!jolokiaUrl) {
      log.debug('Use dummy Jolokia')
      return new DummyJolokia()
    }

    const options = await this.loadJolokiaOptions()
    if (!options.fetchError) {
      // Default fetch() error handler (called "fetchError" in Jolokia 2.1.x, called "ajaxError" in 2.0.x and earlier)
      options.fetchError = this.fetchError()
    }

    await this.configureAuthorization(options)

    const jolokia = new Jolokia(options)
    jolokia.stop()

    // let's check if we can call faster jolokia.list()
    await this.checkListOptimisation(jolokia)

    // Run any post-create processing that should be done before the resolved
    // Jolokia is returned
    postCreate?.(jolokia)

    return jolokia
  }

  private async configureAuthorization(options: RequestOptions): Promise<undefined> {
    const connection = await connectService.getCurrentConnection()
    if (!options.headers) {
      options.headers = {}
    }

    // Set Authorization header depending on current setup
    let authConfigured = false
    if ((await userService.isLogin()) && userService.getToken()) {
      log.debug('Set authorization header to token')
      ;(options.headers as Record<string, string>)['Authorization'] = `Bearer ${userService.getToken()}`
      authConfigured = true
    }

    if (connection && connection.username && connection.password) {
      if (!authConfigured) {
        // we'll simply let Jolokia set the "Authorization: Basic <base64(username:password)>"
        log.debug('Set authorization header to username/password')
        options.username = connection.username
        options.password = connection.password
      } else {
        // we can't have two Authorization headers (one for proxy servlet and one for remote Jolokia agent), so
        // we have to be smart here
        ;(options.headers as Record<string, string>)['X-Jolokia-Authorization'] = basicAuthHeaderValue(
          connection.username,
          connection.password,
        )
      }
    }

    const token = getCookie('XSRF-TOKEN')
    if (token) {
      // For CSRF protection with Spring Security
      log.debug('Set XSRF token header from cookies')
      ;(options.headers as Record<string, string>)['X-XSRF-TOKEN'] = token
    }
  }

  private fetchError(resolve?: AjaxErrorResolver): FetchErrorCallback {
    const errorThreshold = 2
    let errorCount = 0
    let errorToastDisplayed = false
    // this callback is new in Jolokia 2.1.x and gets two parameters:
    // - response if there's a HTTP!=200 problem
    // - error if there's communication error or fetch() configuration error (like bad header or GET with body)
    return (response: Response | null, _error: DOMException | TypeError | string | null) => {
      if (response && response.status && (response.status == 401 || response.status == 403)) {
        const url = new URL(window.location.href)
        // If window was opened to connect to remote Jolokia endpoint
        if (url.searchParams.has(PARAM_KEY_CONNECTION) || sessionStorage.getItem(SESSION_KEY_CURRENT_CONNECTION)) {
          // we're in connected tab/window and Jolokia access attempt ended with 401/403
          // if this 401 is delivered with 'WWW-Authenticate: Basic realm="xxx"' then native browser popup
          // would appear to collect the credentials from user and store them (if user allows) in browser's
          // password manager
          // We've prevented this behaviour by translating 'WWW-Authenticate: Basic xxx' to
          // 'WWW-Authenticate: Hawtio original-scheme="Basic" ...'
          // this is how we are sure that React dialog is presented to collect the credentials and put them
          // into session storage
          if (!window.isSecureContext) {
            // but this is NOT possible in insecure context where we can't use window.crypto.subtle object
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
            log.debug('Logging out due to fetch() error: status =', response.status)
            login && userService.logout()
          })
        }
      } else {
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
  protected async checkListOptimisation(jolokia: IJolokiaSimple): Promise<void> {
    log.debug('Check if we can call optimised jolokia.list() operation')
    // hawtio/hawtio-next#635: we pass an executor which accepts only resolve cb - we never call reject cb even
    // on error, but we ensure that resolve cb is called
    return new Promise<void>(resolve => {
      const successFn: SimpleResponseCallback = (value: JolokiaResponseValue) => {
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

      const errorFn: ErrorCallback = (response: JolokiaErrorResponse) => {
        log.debug('Operation "list" failed due to:', response.error)
        log.debug('Optimisation on jolokia.list() not available')
        resolve() // optimisation not happening
      }

      jolokia.list(
        escapeMBeanPath(this.config.mbean),
        onListSuccessAndError(successFn, errorFn, { fetchError: this.fetchError(resolve) }),
      )
    })
  }

  private async loadJolokiaOptions(): Promise<RequestOptions> {
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

  list(options?: SimpleRequestOptions): Promise<OptimisedJmxDomains> {
    return this.doList([], options)
  }

  sublist(paths: string | string[], options?: SimpleRequestOptions): Promise<OptimisedJmxDomains> {
    return this.doList(Array.isArray(paths) ? paths : [paths], options)
  }

  private async doList(paths: string[], options: SimpleRequestOptions = {}): Promise<OptimisedJmxDomains> {
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

    const { success, error: errorFn, fetchError } = options

    return new Promise((resolve, reject) => {
      // Override fetchError to make sure it terminates in case of ajax error
      options.fetchError = (response, error) => {
        if (fetchError !== 'ignore') {
          fetchError?.(response, error)
        }
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
              if (errorFn && errorFn !== 'ignore') {
                errorFn?.(error, 0)
              }
              reject(error)
            },
            options,
          )
          if (paths.length === 0) {
            jolokia.execute(mbean, 'list()', execOptions)
          } else if (paths.length === 1) {
            jolokia.execute(mbean, 'list(java.lang.String)', paths[0], execOptions)
          } else {
            // Bulk request and merge the result
            const requests: JolokiaRequest[] = paths.map(path => ({
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
              if (errorFn && errorFn !== 'ignore') {
                errorFn?.(error, 0)
              }
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
            const requests: JolokiaRequest[] = paths.map(path => ({ type: 'list', path, config: listOptions }))
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

  private bulkList(jolokia: IJolokiaSimple, requests: JolokiaRequest[], listOptions: SimpleRequestOptions) {
    // bulk responses contain Jolokia generic responses, not @jolokia.js/simple response _values_
    const bulkResponse: (JolokiaSuccessResponse | JolokiaErrorResponse)[] = []
    const mergeResponses = () => {
      const domains = bulkResponse
        .filter(response => {
          if (!Jolokia.isError(response)) {
            return true
          } else {
            log.warn('Bulk list response error:', response.error)
            return false
          }
        })
        .map((r: JolokiaResponse) => {
          // it's already filtered for success responses
          const response = r as JolokiaSuccessResponse
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
        (response: JolokiaSuccessResponse, _index: number) => {
          // Response can never be string in Hawtio's setup of Jolokia
          bulkResponse.push(response as JolokiaSuccessResponse)
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
        listOptions as SimpleRequestOptions,
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

  /**
   * Configure Jolokia's `fetchError` callback which ensures that promises returned by this API are rejected
   * in case of Jolokia/HTTP error
   * @param options
   * @param reject
   * @private
   */
  private configureFetchErrorCallback(
    options: RequestOptions | SimpleRequestOptions | undefined,
    reject: (reason?: unknown) => void,
  ): BaseRequestOptions {
    if (!options) {
      options = {}
    }
    const fetchError = options.fetchError
    options.fetchError = (response: Response | null, error: DOMException | TypeError | string | null): void => {
      if (typeof fetchError === 'function') {
        ;(fetchError as FetchErrorCallback)?.(response, error)
      }
      // reject the relevant promise on any HTTP/communication error
      reject()
    }
    return options
  }

  /**
   * Reading all attributes of an MBean as a record (key-value pairs)
   * @param mbean
   * @param options
   */
  async readAttributes(mbean: string, options?: RequestOptions): Promise<AttributeValues> {
    const jolokia = await this.getJolokia()
    return new Promise((resolve, reject) => {
      options = this.configureFetchErrorCallback(options, reject)
      jolokia.request(
        { type: 'read', mbean },
        onAttributeSuccessAndError(
          (response: JolokiaSuccessResponse) => {
            // Response can never be string/number in Hawtio's setup of Jolokia
            resolve(response.value as AttributeValues)
          },
          error => {
            log.error('Error during readAttributes:', error)
            resolve({})
          },
          options,
        ),
      )
    })
  }

  /**
   * Reading single attribute of an MBean
   * @param mbean
   * @param attribute
   * @param options
   */
  async readAttribute(mbean: string, attribute: string, options?: RequestOptions): Promise<unknown> {
    const jolokia = await this.getJolokia()
    return new Promise((resolve, reject) => {
      options = this.configureFetchErrorCallback(options, reject)
      jolokia.request(
        { type: 'read', mbean, attribute },
        onAttributeSuccessAndError(
          (response: JolokiaSuccessResponse) => {
            resolve(response.value)
          },
          error => {
            log.error('Error during readAttribute:', error)
            resolve(null)
          },
          options,
        ),
      )
    })
  }

  /**
   * Writing a single attribute of an MBean
   * @param mbean
   * @param attribute
   * @param value
   * @param options
   */
  async writeAttribute(mbean: string, attribute: string, value: unknown, options?: RequestOptions): Promise<unknown> {
    const jolokia = await this.getJolokia()
    return new Promise((resolve, reject) => {
      options = this.configureFetchErrorCallback(options, reject)
      jolokia.request(
        { type: 'write', mbean, attribute, value },
        onAttributeSuccessAndError(
          (response: JolokiaSuccessResponse) => {
            resolve(response.value)
          },
          error => {
            log.error('Error during writeAttribute:', error)
            resolve(null)
          },
          options,
        ),
      )
    })
  }

  /**
   * Execute an operation on an MBean
   * @param mbean
   * @param operation
   * @param args
   * @param options
   */
  async execute(
    mbean: string,
    operation: string,
    args: unknown[] = [],
    options?: SimpleRequestOptions,
  ): Promise<unknown> {
    const jolokia = await this.getJolokia()
    return new Promise((resolve, reject) => {
      options = this.configureFetchErrorCallback(options, reject)
      jolokia.execute(
        mbean,
        operation,
        ...args,
        onExecuteSuccessAndError(
          response => resolve(response),
          error => reject(error.stacktrace || error.error),
          options,
        ),
      )
    })
  }

  async search(mbeanPattern: string): Promise<string[]> {
    const jolokia = await this.getJolokia()
    return new Promise((resolve, reject) => {
      const options: SimpleRequestOptions = this.configureFetchErrorCallback({}, reject)
      jolokia.search(
        mbeanPattern,
        onSearchSuccessAndError(
          response => resolve(response as string[]),
          error => {
            log.error('Error during search:', error)
            resolve([])
          },
          options,
        ),
      )
    })
  }

  async bulkRequest(
    requests: JolokiaRequest[],
    options?: RequestOptions,
  ): Promise<(JolokiaSuccessResponse | JolokiaErrorResponse)[]> {
    const jolokia = await this.getJolokia()
    return new Promise((resolve, reject) => {
      const bulkResponse: (JolokiaSuccessResponse | JolokiaErrorResponse)[] = []
      options = this.configureFetchErrorCallback(options, reject)
      jolokia.request(
        requests,
        onBulkSuccessAndError(
          (response: JolokiaSuccessResponse) => {
            // Response can never be string in Hawtio's setup of Jolokia
            bulkResponse.push(response as JolokiaSuccessResponse)
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
          options,
        ),
      )
    })
  }

  async register(
    request: JolokiaRequest,
    callback: (response: JolokiaSuccessResponse | JolokiaErrorResponse) => void,
  ): Promise<number> {
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
class DummyJolokia implements IJolokiaSimple {
  CLIENT_VERSION = 'DUMMY'
  isDummy = true
  private running = false

  // jolokia.js API

  async request(
    _request: JolokiaRequest | JolokiaRequest[],
    _params?: RequestOptions,
  ): Promise<
    | string
    | JolokiaSuccessResponse
    | JolokiaErrorResponse
    | (JolokiaSuccessResponse | JolokiaErrorResponse)[]
    | Response
    | undefined
  > {
    return
  }

  register(_callback: JobCallback | JobRegistrationConfig, ..._requests: JolokiaRequest[]) {
    return 0
  }
  unregister(_handle: number) {
    // no-op
  }
  jobs() {
    return []
  }
  start(_interval?: number) {
    this.running = true
  }
  stop() {
    this.running = false
  }
  isRunning() {
    return this.running
  }

  addNotificationListener(_opts: NotificationOptions): Promise<NotificationHandle> {
    return Promise.resolve({ id: '0', mode: 'pull' })
  }
  removeNotificationListener(_handle: NotificationHandle) {
    return Promise.resolve(true)
  }
  unregisterNotificationClient() {
    return Promise.resolve(true)
  }

  escape(part: string): string {
    return Jolokia.escape(part)
  }
  escapePost(part: string): string {
    return Jolokia.escapePost(part)
  }
  isError(resp: JolokiaResponse): resp is JolokiaErrorResponse {
    return Jolokia.isError(resp)
  }

  // @jolokia.js/simple API

  async getAttribute(
    _mbean: string,
    ...params: (string | string[] | SimpleRequestOptions)[]
  ): Promise<ReadResponseValue> {
    this.callDetectedCallback(...params)
    return null
  }

  async setAttribute(
    _mbean: string,
    _attribute: string,
    _value: unknown,
    ...params: (string | string[] | SimpleRequestOptions)[]
  ): Promise<WriteResponseValue> {
    this.callDetectedCallback(...params)
    return null
  }

  async execute(
    _mbean: string,
    _operation: string,
    ...params: (unknown | SimpleRequestOptions)[]
  ): Promise<ExecResponseValue> {
    this.callDetectedCallback(...params)
    return null
  }

  async search(_mbeanPattern: string, opts?: SimpleRequestOptions): Promise<SearchResponseValue> {
    opts?.success?.([])
    return []
  }

  async version(opts?: SimpleRequestOptions): Promise<VersionResponseValue> {
    opts?.success?.({} as VersionResponseValue)
    return {} as VersionResponseValue
  }

  async list(...params: (string[] | string | SimpleRequestOptions)[]): Promise<ListResponseValue> {
    this.callDetectedCallback(...params)
    return null
  }

  private callDetectedCallback(...params: (unknown | string | string[] | SimpleRequestOptions)[]) {
    if (
      params.length > 0 &&
      typeof params[params.length - 1] === 'object' &&
      'success' in (params[params.length - 1] as SimpleRequestOptions)
    ) {
      ;(params[params.length - 1] as SimpleRequestOptions)?.success?.({})
    }
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

export const jolokiaService = new JolokiaService()
