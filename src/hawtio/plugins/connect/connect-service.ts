import { toString } from '@hawtio/util/strings'
import { joinPaths } from '@hawtio/util/urls'
import Jolokia, { IJolokia } from 'jolokia.js'
import { Connection, Connections } from './connections'

export type ConnectionTestResult = {
  ok: boolean
  message: string
}

const STORAGE_KEY_CONNECTIONS = 'connect.connections'

export const PARAM_KEY_CONNECTION = 'con'

class ConnectService {

  loadConnections(): Connections {
    const conns = localStorage.getItem(STORAGE_KEY_CONNECTIONS)
    return conns ? JSON.parse(conns) : {}
  }

  saveConnections(connections: Connections) {
    localStorage.setItem(STORAGE_KEY_CONNECTIONS, JSON.stringify(connections))
  }

  getConnection(name: string): Connection | null {
    const connections = this.loadConnections()
    return connections[name]
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
    console.debug('Testing connection:', toString(connection))
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
            }
          })
      } catch (error) {
        console.error(error)
        reject(error)
      }
    })
  }

  connect(connection: Connection) {
    console.log('Connecting with options:', toString(connection))
    const url = `/?${PARAM_KEY_CONNECTION}=${connection.name}`
    window.open(url)
  }

  /**
   * Create a Jolokia instance with the given connection.
   */
  private createJolokia(connection: Connection, checkCredentials = false): IJolokia {
    if (checkCredentials) {
      return new Jolokia({
        url: this.getJolokiaUrl(connection),
        method: 'post',
        mimeType: 'application/json',
        username: connection.username,
        password: connection.password
      })
    }

    return new Jolokia({
      url: this.getJolokiaUrl(connection),
      method: 'post',
      mimeType: 'application/json'
    })
  }

  /**
   * Get the Jolokia URL for the given connection.
   */
  getJolokiaUrl(connection: Connection): string {
    console.debug("Connect to server with connection:", toString(connection))
    if (connection.jolokiaUrl) {
      console.debug("Using provided URL:", connection.jolokiaUrl)
      return connection.jolokiaUrl
    }

    // TODO: Better handling of doc base and proxy URL construction
    const url = joinPaths(
      '/proxy',
      connection.scheme || 'http',
      connection.host || 'localhost',
      String(connection.port || 80),
      connection.path)
    console.debug("Using URL:", url)
    return url
  }

  /**
   * Get the Jolokia URL for the given connection name.
   */
  getJolokiaUrlFromName(name: string): string | null {
    const connection = this.getConnection(name)
    return connection ? this.getJolokiaUrl(connection) : null
  }

  private forbiddenReasonMatches(response: JQueryXHR, reason: string): boolean {
    // Preserve compatibility with versions of Hawtio 2.x that return JSON on 403 responses
    if (response.responseJSON && response.responseJSON['reason']) {
      return response.responseJSON['reason'] === reason
    }
    // Otherwise expect a response header containing a forbidden reason
    return response.getResponseHeader("Hawtio-Forbidden-Reason") === reason
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
