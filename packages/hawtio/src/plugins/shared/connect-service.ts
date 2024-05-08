import { eventService, hawtio } from '@hawtiosrc/core'
import { decrypt, encrypt, generateKey, toBase64, toByteArray } from '@hawtiosrc/util/crypto'
import { toString } from '@hawtiosrc/util/strings'
import { joinPaths } from '@hawtiosrc/util/urls'
import Jolokia from 'jolokia.js'
import { log } from './globals'

export type Connections = {
  [key: string]: Connection
}

export type Connection = {
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
  name: '',
  scheme: 'https',
  host: 'localhost',
  port: 8080,
  path: '/hawtio/jolokia',
} as const

export type ConnectionTestResult = {
  ok: boolean
  message: string
}

export type ConnectionCredentials = {
  username: string
  password: string
}

export type LoginResult = { type: 'success' } | { type: 'failure' } | { type: 'throttled'; retryAfter: number }

const STORAGE_KEY_CONNECTIONS = 'connect.connections'

const SESSION_KEY_CURRENT_CONNECTION = 'connect.currentConnection'
const SESSION_KEY_SALT = 'connect.salt'
const SESSION_KEY_CREDENTIALS = 'connect.credentials' // Encrypted

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
  checkReachable(connection: Connection): Promise<boolean>
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
  private currentConnection: string | null

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
      sessionStorage.setItem(SESSION_KEY_CURRENT_CONNECTION, JSON.stringify(conn))
      return conn
    }

    // Check remote connection from session storage
    conn = sessionStorage.getItem(SESSION_KEY_CURRENT_CONNECTION)
    return conn ? JSON.parse(conn) : null
  }

  getCurrentConnectionName(): string | null {
    return this.currentConnection
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

    // Make sure scheme is not compromised for each connection
    Object.values(conns).forEach(conn => {
      if (conn.scheme !== 'http' && conn.scheme !== 'https') {
        log.warn('Invalid scheme for connection:', conn)
        // Force resetting to 'http' for any invalid scheme
        conn.scheme = 'http'
      }
    })

    return conns
  }

  saveConnections(connections: Connections) {
    localStorage.setItem(STORAGE_KEY_CONNECTIONS, JSON.stringify(connections))
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

  async checkReachable(connection: Connection): Promise<boolean> {
    const result = await this.testConnection(connection)
    return result.ok
  }

  testConnection(connection: Connection): Promise<ConnectionTestResult> {
    log.debug('Testing connection:', toString(connection))
    return new Promise<ConnectionTestResult>((resolve, reject) => {
      try {
        this.createJolokia(connection).request(
          { type: 'version' },
          {
            success: () => {
              resolve({ ok: true, message: 'Connection successful' })
            },
            ajaxError: (response: JQueryXHR) => {
              switch (response.status) {
                case 401:
                  resolve({ ok: true, message: 'Connection successful' })
                  break
                case 403:
                  if (this.forbiddenReasonMatches(response, 'HOST_NOT_ALLOWED')) {
                    resolve({ ok: false, message: 'Host not allowlisted' })
                  } else {
                    resolve({ ok: true, message: 'Connection successful' })
                  }
                  break
                default:
                  resolve({ ok: false, message: 'Connection failed' })
              }
            },
          },
        )
      } catch (error) {
        log.error(error)
        reject(error)
      }
    })
  }

  private forbiddenReasonMatches(response: JQueryXHR, reason: string): boolean {
    // Preserve compatibility with versions of Hawtio 2.x that return JSON on 403 responses
    if (response.responseJSON && response.responseJSON['reason']) {
      return response.responseJSON['reason'] === reason
    }
    // Otherwise expect a response header containing a forbidden reason
    return response.getResponseHeader('Hawtio-Forbidden-Reason') === reason
  }

  connect(connection: Connection) {
    log.debug('Connecting with options:', toString(connection))
    const basepath = hawtio.getBasePath() ?? ''
    const url = `${basepath}/?${PARAM_KEY_CONNECTION}=${connection.name}`
    log.debug('Opening URL:', url)
    window.open(url)
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
            resolve({ type: 'failure' })
          },
        },
      )
    })
    if (result.type !== 'success') {
      return result
    }

    // Persist credentials to session storage
    await this.setCurrentCredentials({ username, password })
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
      const connectionKey = searchParams.get(PARAM_KEY_CONNECTION) ?? ''
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
