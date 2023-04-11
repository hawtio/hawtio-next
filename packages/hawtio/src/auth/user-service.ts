import { eventService } from '__root__/core'
import { log, PATH_LOGOUT, PATH_USER, PUBLIC_USER } from './globals'

export interface IUserService {
  getUsername(): Promise<string>
  isLogin(): Promise<boolean>
  getToken(): string | null
  setToken(token: string): void
  logout(): Promise<void>
}

type Login = {
  username: string
  isLogin: boolean
}

class UserService implements IUserService {
  private login: Promise<Login>
  private token: string | null = null

  constructor() {
    this.login = this.fetchUser(true)
  }

  private async fetchUser(retry: boolean): Promise<Login> {
    try {
      const res = await fetch(PATH_USER)
      if (!res.ok) {
        log.error('Failed to login:', res.status, res.statusText)
        if (retry && res.status === 403) {
          // Wait for 1000ms in case login session is not ready at server side
          // This retry is mainly needed for Spring Security support
          await new Promise(resolve => setTimeout(resolve, 1000))
          return this.fetchUser(false)
        }
        return { username: PUBLIC_USER, isLogin: false }
      }

      const username = await res.json()
      log.info('Logged in as:', username)

      // Send login event
      eventService.login()

      return { username, isLogin: true }
    } catch (err) {
      // Silently ignore as mostly it's just not logged-in yet
      log.debug('Failed to get logged-in user from', PATH_USER, '-', err)
      return { username: PUBLIC_USER, isLogin: false }
    }
  }

  async getUsername(): Promise<string> {
    return (await this.login).username
  }

  async isLogin(): Promise<boolean> {
    return (await this.login).isLogin
  }

  getToken(): string | null {
    return this.token
  }

  setToken(token: string) {
    this.token = token
  }

  async logout() {
    const login = await this.login
    if (!login.isLogin) {
      log.debug('Not logged in')
      return
    }

    log.info('Logged out:', login.username)

    // Send logout event
    eventService.logout()

    log.debug('Redirect to:', PATH_LOGOUT)
    window.location.href = PATH_LOGOUT
  }
}

export const userService = new UserService()

// Export non-exported definitions for testing
export const __testing__ = {
  UserService,
}
