import { DEFAULT_USER, log, PATH_USER } from './globals'

export interface IUserService {
  getUsername(): Promise<string>
  isLogin(): Promise<boolean>
  getToken(): string | null
  setToken(token: string): void
  logout(): void
}

class UserService implements IUserService {
  private username: Promise<string>
  private login: Promise<boolean>
  private token: string | null = null

  constructor() {
    this.username = this.fetchUser()
    this.login = this.username.then(u => u !== DEFAULT_USER)
  }

  private async fetchUser(): Promise<string> {
    try {
      const res = await fetch(PATH_USER)
      const user = await res.text()
      log.info('Logged in as:', user)
      return user
    } catch (err) {
      // Silently ignore as mostly it's just not logged-in yet
      log.debug('Failed to get logged-in user from', PATH_USER, '-', err)
    }
    return DEFAULT_USER
  }

  getUsername(): Promise<string> {
    return this.username
  }

  isLogin(): Promise<boolean> {
    return this.login
  }

  getToken(): string | null {
    return this.token
  }

  setToken(token: string) {
    this.token = token
  }

  logout() {
    // TODO: impl
  }
}

export const userService = new UserService()

// Export non-exported definitions for testing
export const __testing__ = {
  UserService,
}
