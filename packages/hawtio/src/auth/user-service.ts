import { Logger } from '@hawtiosrc/core'

export const DEFAULT_USER = 'public'

const log = Logger.get('hawtio-auth')

export class UserService {
  private username = DEFAULT_USER
  private password: string | null = null
  private token: string | null = null
  private _login = false

  private reset(): void {
    this.username = DEFAULT_USER
    this.password = null
    this.token = null
    this._login = false
  }

  /**
   * Log in as a specific user.
   */
  login(username: string, password: string, token?: string) {
    this.username = username
    this.password = password
    if (token) {
      this.token = token
    }
    this._login = true
    log.info('Log in as:', this.username)
  }

  /**
   * Log out the current user.
   */
  logout() {
    if (!this._login) {
      log.debug('Not logged in')
      return
    }
    log.info('Log out:', this.username)
    this.reset()
  }

  getToken(): string | null {
    return this.token
  }

  isLogin(): boolean {
    return this._login
  }

  isDefaultUser(): boolean {
    return this.username === DEFAULT_USER
  }
}

export const userService = new UserService()
