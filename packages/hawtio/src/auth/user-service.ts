import { eventService } from '@hawtiosrc/core'
import { log, PATH_LOGOUT, PATH_USER, PUBLIC_USER } from './globals'

export type User = {
  username: string
  isLogin: boolean
  isLoading?: boolean
}

export type ResolveUser = (user: User) => void
export type FetchUserHook = (resolve: ResolveUser, proceed?: () => boolean) => Promise<boolean>
export type LogoutHook = () => Promise<boolean>

export interface IUserService {
  addFetchUserHook(name: string, hook: FetchUserHook): void
  addLogoutHook(name: string, hook: LogoutHook): void
  fetchUser(retry?: boolean, proceed?: () => boolean): Promise<void>
  getUsername(): Promise<string>
  isLogin(): Promise<boolean>
  getToken(): string | null
  setToken(token: string): void
  logout(): Promise<void>
}

class UserService implements IUserService {
  private readonly user: Promise<User>
  private resolveUser: ResolveUser = () => {
    // no-op
  }
  private fetchUserHooks: { [name: string]: FetchUserHook } = {}
  private logoutHooks: { [name: string]: LogoutHook } = {}
  private token: string | null = null

  constructor() {
    this.user = new Promise<User>(resolve => {
      this.resolveUser = resolve
    })
  }

  addFetchUserHook(name: string, hook: FetchUserHook) {
    this.fetchUserHooks[name] = hook
  }

  addLogoutHook(name: string, hook: LogoutHook) {
    this.logoutHooks[name] = hook
  }

  /**
   * Sync login status with the server by fetching login user.
   */
  async fetchUser(retry = true, proceed?: () => boolean): Promise<void> {
    // First, let fetch user hooks to resolve the user in a special way
    for (const [name, fetchUser] of Object.entries(this.fetchUserHooks)) {
      const resolved = await fetchUser(this.resolveUser, proceed)
      if (proceed && !proceed()) {
        return
      }
      log.debug('Invoke fetch user hook', name, ': resolved =', resolved)
      if (resolved) {
        // Login succeeded
        eventService.login()
        return
      }
    }

    // Default fetch user logic
    try {
      const res = await fetch(PATH_USER)
      if (!res.ok) {
        log.error('Failed to fetch user:', res.status, res.statusText)
        if (retry && res.status === 403) {
          // Wait for 1000ms in case login session is not ready at server side.
          // This retry was originally introduced for Spring Security support,
          // but it no longer relies on the retry. Now it is kept mainly for
          // additional resilience at authentication.
          await new Promise(resolve => setTimeout(resolve, 1000))
          return this.fetchUser(false)
        }

        this.resolveUser({ username: PUBLIC_USER, isLogin: false })
        return
      }

      const username = await res.json()
      log.info('Logged in as:', username)
      this.resolveUser({ username, isLogin: true })

      // Send login event
      eventService.login()
    } catch (err) {
      // Silently ignore as mostly it's just not logged-in yet
      log.debug('Failed to get logged-in user from', PATH_USER, '-', err)
      this.resolveUser({ username: PUBLIC_USER, isLogin: false })
    }
  }

  async getUsername(): Promise<string> {
    return (await this.user).username
  }

  async isLogin(): Promise<boolean> {
    return (await this.user).isLogin
  }

  async isLoading(): Promise<boolean> {
    const u = await this.user
    return u.isLoading ?? false
  }

  getToken(): string | null {
    return this.token
  }

  setToken(token: string) {
    this.token = token
  }

  async logout() {
    const login = await this.user
    if (!login.isLogin) {
      log.debug('Not logged in')
      return
    }

    log.info('Log out:', login.username)

    // Send logout event
    eventService.logout()

    // First, let logout hooks to log out in a special way
    for (const [name, logout] of Object.entries(this.logoutHooks)) {
      const result = await logout()
      log.debug('Invoke logout hook', name, ': result =', result)
      if (result) {
        // Logout succeeded
        return
      }
    }

    // Default logout logic
    log.debug('Redirect to:', PATH_LOGOUT)
    window.location.href = PATH_LOGOUT
  }
}

export const userService = new UserService()

// Export non-exported definitions for testing
export const __testing__ = {
  UserService,
}
