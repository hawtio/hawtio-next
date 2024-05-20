import { eventService, hawtio } from '@hawtiosrc/core'
import { decrypt, encrypt, generateKey, toBase64, toByteArray } from '@hawtiosrc/util/crypto'
import { toString } from '@hawtiosrc/util/strings'
import { joinPaths } from '@hawtiosrc/util/urls'
import Jolokia from 'jolokia.js'
import { log } from './globals'

export type Connections = {
  // key is ID, not name, so we can alter the name
  [key: string]: Connection
}

export type Connection = {
  id: string
  name: string
  scheme: 'http' | 'https'
  host: string
  port: number
  path: string

  jolokiaUrl?: string
  username?: string
  password?: string

  // TODO: check if it is used
  token?: string
}

export const INITIAL_CONNECTION: Connection = {
  id: '',
  name: '',
  scheme: 'https',
  host: 'localhost',
  port: 8080,
  path: '/hawtio/jolokia',
} as const

export type ConnectionTestResult = {
  status: ConnectStatus
  message: string
}

export type ConnectionCredentials = {
  username: string
  password: string
}

export type LoginResult =
  | { type: 'success' }
  | { type: 'failure' }
  | { type: 'throttled'; retryAfter: number }
  | { type: 'session-expired' }

/**
 * Remote connection status. "not-reachable-securely" is for connections that can't be used in insecure contexts.
 */
export type ConnectStatus = 'not-reachable' | 'reachable' | 'not-reachable-securely'

const STORAGE_KEY_CONNECTIONS = 'connect.connections'

const SESSION_KEY_SALT = 'connect.salt'
const SESSION_KEY_CREDENTIALS = 'connect.credentials' // Encrypted

export const SESSION_KEY_CURRENT_CONNECTION = 'connect.currentConnection'
export const PARAM_KEY_CONNECTION = 'con'
export const PARAM_KEY_REDIRECT = 'redirect'

const LOGIN_PATH = '/connect/login'

export interface IConnectService {
  getCurrentConnectionName(): string | null
  getCurrentConnection(): Promise<Connection | null>
  getCurrentCredentials(): Promise<ConnectionCredentials | null>
  loadConnections(): Connections
  saveConnections(connections: Connections): void
  getConnection(name: string): Connection | null
  connectionToUrl(connection: Connection): string
  checkReachable(connection: Connection): Promise<ConnectStatus>
  testConnection(connection: Connection): Promise<ConnectionTestResult>
  connect(connection: Connection): void
  login(username: string, password: string): Promise<LoginResult>
  redirect(): void
  createJolokia(connection: Connection, checkCredentials?: boolean): Jolokia
  getJolokiaUrl(connection: Connection): string
  getJolokiaUrlFromName(name: string): string | null
  getLoginPath(): string
  export(connections: Connections): void
}

class ConnectService implements IConnectService {
  private readonly currentConnection: string | null

  constructor() {
    this.currentConnection = this.initCurrentConnection()
  }

  private initCurrentConnection(): string | null {
    // Check remote connection from URL query param
    const url = new URL(window.location.href)
    const searchParams = url.searchParams
    log.debug('Checking search params:', searchParams.toString())
    let conn = searchParams.get(PARAM_KEY_CONNECTION)
    if (conn) {
      searchParams.delete(PARAM_KEY_CONNECTION, conn)
      sessionStorage.setItem(SESSION_KEY_CURRENT_CONNECTION, JSON.stringify(conn))
      // clear "con" parameter - will be available in session storage only
      url.search = searchParams.toString()
      window.history.replaceState(null, '', url)

      return conn
    }

    // Case when user may refresh the page after "con" parameter has already been cleared
    // Check remote connection from session storage
    conn = sessionStorage.getItem(SESSION_KEY_CURRENT_CONNECTION)
    return conn ? JSON.parse(conn) : null
  }

  getCurrentConnectionId(): string | null {
    return this.currentConnection
  }

  getCurrentConnectionName(): string | null {
    const id = this.currentConnection
    const connections = this.loadConnections()
    if (!id || !connections[id!]) {
      return null
    }
    return connections[id!]!.name ?? null
  }

  async getCurrentConnection(): Promise<Connection | null> {
    const conn = this.currentConnection ? this.getConnection(this.currentConnection) : null
    if (!conn) {
      return null
    }

    // Apply credentials if it exists
    const credentials = await this.getCurrentCredentials()
    if (!credentials) {
      return conn
    }
    conn.username = credentials.username
    conn.password = credentials.password
    this.clearCredentialsOnLogout()

    return conn
  }

  private clearCredentialsOnLogout() {
    eventService.onLogout(() => sessionStorage.clear())
  }

  async getCurrentCredentials(): Promise<ConnectionCredentials | null> {
    if (!window.isSecureContext) {
      return null
    }
    const saltItem = sessionStorage.getItem(SESSION_KEY_SALT)
    if (!saltItem) {
      return null
    }
    const salt = toByteArray(saltItem)

    const credItem = sessionStorage.getItem(SESSION_KEY_CREDENTIALS)
    if (!credItem) {
      return null
    }
    const key = await generateKey(salt)
    return JSON.parse(await decrypt(key, credItem))
  }

  private async setCurrentCredentials(credentials: ConnectionCredentials) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16))
    sessionStorage.setItem(SESSION_KEY_SALT, toBase64(salt))
    const key = await generateKey(salt)
    const encrypted = await encrypt(key, JSON.stringify(credentials))
    sessionStorage.setItem(SESSION_KEY_CREDENTIALS, encrypted)
  }

  loadConnections(): Connections {
    const item = localStorage.getItem(STORAGE_KEY_CONNECTIONS)
    if (!item) {
      return {}
    }
    const conns: Connections = JSON.parse(item)

    Object.values(conns).forEach(conn => {
      // Make sure scheme is not compromised for each connection
      if (conn.scheme !== 'http' && conn.scheme !== 'https') {
        log.warn('Invalid scheme for connection:', conn)
        // Force resetting to 'http' for any invalid scheme
        conn.scheme = 'http'
      }
      // Make sure there's an ID for each connection
      if (!conn.id) {
        this.generateId(conn, conns)
      }
    })

    return conns
  }

  saveConnections(connections: Connections) {
    localStorage.setItem(STORAGE_KEY_CONNECTIONS, JSON.stringify(connections))
  }

  generateId(connection: Connection, connections: Connections) {
    for (;;) {
      if (!connection.id) {
        // first, generate only for new connection and keep for imported connection
        connection.id = '' + Math.floor(Math.random() * 1000000)
        connection.id = 'c' + connection.id.padStart(6, '0') + '-' + Date.now()
      }
      let exists = false
      for (const c in connections) {
        if (c === connection.id) {
          exists = true
        }
        if (exists) {
          // we've imported a connection and there's already a connection with given ID
          // so we have to re-generate id for the imported connection
          connection.id = ''
        }
      }
      if (!exists) {
        break
      }
    }
  }

  getConnection(name: string): Connection | null {
    const connections = this.loadConnections()
    return connections[name] ?? null
  }

  connectionToUrl(connection: Connection): string {
    let url = `${connection.scheme}://${connection.host}:${connection.port}`
    if (!connection.path.startsWith('/')) {
      url += '/'
    }
    url += connection.path
    return url
  }

  async checkReachable(connection: Connection): Promise<ConnectStatus> {
    try {
      const result = await this.testConnection(connection)
      return result.status
    } catch (error) {
      return 'not-reachable'
    }
  }

  testConnection(connection: Connection): Promise<ConnectionTestResult> {
    log.debug('Testing connection:', toString(connection))
    // test the connection without credentials, so 401 or 403 are treated as "reachable", but actual
    // connection will require authentication
    // When server returns "WWW-Authenticate: Basic xxx", we can't prevent showing native popup dialog with xhr,
    // but we can do that with fetch + "credentials:'omit'"
    // However we have to include the credentials, because it's not only about "Authorization" header (which may
    // be created using data stored in browser's password manager) - it's also about cookies. When testing
    // reachability of remote Jolokia agent, we have to send JSESSIONID, because /proxy/* is protected. However
    // we prevent native browser dialog because Hawtio proxy translates "WWW-Authenticate: Basic xxx", so it
    // doesn't include "Basic" scheme. This is enough for the browser to skip the dialog. Even with xhr.
    return new Promise<ConnectionTestResult>((resolve, reject) => {
      try {
        fetch(this.getJolokiaUrl(connection), {
          method: 'post',
          // with application/json, I'm getting "CanceledError: Request stream has been aborted" when running
          // via hawtioMiddleware...
          headers: { 'Content-Type': 'text/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ type: 'version' }),
        })
          .then(response => {
            if (response.ok) {
              // 200-299
              resolve({ status: 'reachable', message: 'Connection successful' })
            } else if (response.status === 401) {
              resolve({
                status: window.isSecureContext ? 'reachable' : 'not-reachable-securely',
                message: window.isSecureContext
                  ? 'Connection successful (auth needed)'
                  : 'Connection failed (insecure context)',
              })
            } else if (response.status === 403) {
              this.forbiddenReasonMatches(response, 'HOST_NOT_ALLOWED').then(matches => {
                if (matches) {
                  resolve({ status: 'not-reachable', message: 'Host not allowlisted' })
                } else {
                  resolve({
                    status: window.isSecureContext ? 'reachable' : 'not-reachable-securely',
                    message: window.isSecureContext
                      ? 'Connection successful (auth failed)'
                      : 'Connection failed (insecure context)',
                  })
                }
              })
            } else {
              resolve({ status: 'not-reachable', message: 'Connection failed' })
            }
          })
          .catch(error => {
            log.error('Exception', error)
            reject(error)
          })
      } catch (error) {
        log.error(error)
        reject(error)
      }
    })
  }

  private async forbiddenReasonMatches(response: Response, reason: string): Promise<boolean> {
    // Preserve compatibility with versions of Hawtio 2.x that return JSON on 403 responses
    return response
      .text()
      .then(txt => {
        const json = JSON.parse(txt)
        // exception will propagate to .catch()
        return json['reason'] === reason
      })
      .catch(_ => {
        // Otherwise expect a response header containing a forbidden reason
        return response.headers.get('Hawtio-Forbidden-Reason') === reason
      })
  }

  connect(connection: Connection) {
    log.debug('Connecting with options:', toString(connection))
    const basepath = hawtio.getBasePath() ?? ''
    const url = `${basepath}/?${PARAM_KEY_CONNECTION}=${connection.id}`
    log.debug('Opening URL:', url)
    // let's open the same connection in the same tab (2nd parameter)
    window.open(url, connection.id)
  }

  /**
   * Log in to the current connection.
   */
  async login(username: string, password: string): Promise<LoginResult> {
    const connection = await this.getCurrentConnection()
    if (!connection) {
      return { type: 'failure' }
    }

    // Check credentials
    const result = await new Promise<LoginResult>(resolve => {
      connection.username = username
      connection.password = password
      this.createJolokia(connection, true).request(
        { type: 'version' },
        {
          success: () => resolve({ type: 'success' }),
          error: () => resolve({ type: 'failure' }),
          ajaxError: (xhr: JQueryXHR) => {
            log.debug('Login error:', xhr.status, xhr.statusText)
            if (xhr.status === 429) {
              // Login throttled
              const retryAfter = parseInt(xhr.getResponseHeader('Retry-After') ?? '0')
              resolve({ type: 'throttled', retryAfter })
              return
            }
            if (xhr.status === 403 && 'SESSION_EXPIRED' === xhr.getResponseHeader('Hawtio-Forbidden-Reason')) {
              resolve({ type: 'session-expired' })
              return
            }
            resolve({ type: 'failure' })
          },
        },
      )
    })
    if (result.type !== 'success') {
      return result
    }

    // Persist credentials to session storage
    if (window.isSecureContext) {
      await this.setCurrentCredentials({ username, password })
    }
    this.clearCredentialsOnLogout()

    return result
  }

  /**
   * Redirect to the URL specified in the query parameter {@link PARAM_KEY_REDIRECT}.
   */
  redirect() {
    const url = new URL(window.location.href)
    let redirect = url.searchParams.get(PARAM_KEY_REDIRECT) ?? '/'
    let safeRedirect: boolean = false

    try {
      const { hostname, port, protocol, searchParams } = new URL(redirect)
      let connectionKey = searchParams.get(PARAM_KEY_CONNECTION) ?? ''
      if (connectionKey === '') {
        connectionKey = sessionStorage.getItem(SESSION_KEY_CURRENT_CONNECTION) ?? ''
      }
      safeRedirect =
        hostname === url.hostname &&
        port === url.port &&
        ['http:', 'https:'].includes(protocol) &&
        connectionKey !== '' &&
        connectionKey === this.currentConnection
    } catch (_e) {
      log.error('Invalid URL')
      eventService.notify({
        type: 'danger',
        message: 'Redirect parameter was modified',
      })
    }

    if (!safeRedirect) {
      redirect = hawtio.getBasePath() ?? '/'
    }

    log.debug('Redirect to:', redirect)
    window.location.href = encodeURI(redirect)
  }

  /**
   * Create a Jolokia instance with the given connection.
   */
  createJolokia(connection: Connection, checkCredentials = false): Jolokia {
    if (checkCredentials) {
      return new Jolokia({
        url: this.getJolokiaUrl(connection),
        method: 'post',
        mimeType: 'application/json',
        username: connection.username,
        password: connection.password,
      })
    }

    return new Jolokia({
      url: this.getJolokiaUrl(connection),
      method: 'post',
      mimeType: 'application/json',
    })
  }

  /**
   * Get the Jolokia URL for the given connection.
   */
  getJolokiaUrl(connection: Connection): string {
    log.debug('Connect to server with connection:', toString(connection))
    if (connection.jolokiaUrl) {
      log.debug('Using provided URL:', connection.jolokiaUrl)
      return connection.jolokiaUrl
    }

    const url = joinPaths(
      hawtio.getBasePath() ?? '',
      '/proxy',
      connection.scheme ?? 'http',
      connection.host ?? 'localhost',
      String(connection.port ?? 80),
      connection.path,
    )
    log.debug('Using URL:', url)
    return url
  }

  /**
   * Get the Jolokia URL for the given connection name.
   */
  getJolokiaUrlFromName(name: string): string | null {
    const connection = this.getConnection(name)
    return connection ? this.getJolokiaUrl(connection) : null
  }

  getLoginPath(): string {
    const basePath = hawtio.getBasePath()
    return `${basePath}${LOGIN_PATH}`
  }

  export(connections: Connections) {
    const content = JSON.stringify(Object.values(connections), null, '  ')
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `hawtio-connections-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export const connectService = new ConnectService()
