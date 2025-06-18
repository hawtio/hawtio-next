import { configManager, eventService, TaskState } from '@hawtiosrc/core'
import { log, PATH_LOGOUT, PATH_USER, PUBLIC_USER } from './globals'

/** Information about logged-in user */
export type User = {
  /** Name of the user */
  username: string
  /** Flag for actual user (`false` means guest or public user) */
  isLogin: boolean
  /** Identifier of authentication method used to fetch the user, so we can later use correct logout */
  loginMethod: string
}

/** User resolving function that resolves user promise */
export type ResolveUser = (user: User) => void

/** A function that may be registered by authentication plugin used to get information about logged-in user */
export type FetchUserHook = (resolve: ResolveUser, proceed?: () => boolean) => Promise<boolean>
/** A function that may be registered by authentication plugin used to log out a user */
export type LogoutHook = () => Promise<boolean>

export interface IUserService {
  addFetchUserHook(name: string, hook: FetchUserHook): void
  addLogoutHook(name: string, hook: LogoutHook): void
  fetchUser(retry?: boolean, proceed?: () => boolean): Promise<void>
  getUsername(): Promise<string>
  isLogin(): Promise<boolean>
  getLoginMethod(): Promise<string>
  getToken(): string | null
  setToken(token: string): void
  logout(): Promise<void>
}

class UserService implements IUserService {
  /** The main promise resolving to `User` instance. That's why we need full browser redirect on logout. */
  private readonly user: Promise<User>
  /** user promise resolve method - to be called by registered auth plugins or default auth plugin */
  private resolveUser: ResolveUser = () => {
    // no-op
  }

  /** Named authentication hooks used to fetch information about actual user logged into Hawtio. */
  private fetchUserHooks: { [name: string]: FetchUserHook } = {}
  /** Named authentication hooks used to logout the user. */
  private logoutHooks: { [name: string]: LogoutHook } = {}

  /** Bearer Token to be used by Jolokia, set by plugins on successful authentication */
  // TODO: Jolokia service should use auth plugins to configure the headers
  private token: string | null = null

  constructor() {
    this.user = new Promise<User>(resolve => {
      this.resolveUser = resolve
    })
  }

  addFetchUserHook(name: string, hook: FetchUserHook) {
    this.fetchUserHooks[name] = hook
    configManager.initItem(`Registration of ${name} auth hook`, TaskState.finished, "config")
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
        // Login succeeded - only with resolved=true the passed promise-resolving method was called
        eventService.login()
        return
      }
    }

    // this.user promise was still not resolved, useUser()'s effect is still waiting
    await this.defaultFetchUser(retry, proceed)
  }

  /**
   * Default user fetching logic that checks `/user` endpoint that returns json string value with named/logged-in user
   * @param retry
   * @param proceed
   * @private
   */
  private async defaultFetchUser(retry = true, proceed?: () => boolean): Promise<void> {
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
          return this.defaultFetchUser(false, proceed)
        }

        this.resolveUser({ username: PUBLIC_USER, isLogin: false, loginMethod: 'form' })
        return
      }

      const username = await res.json()
      log.info('Logged in as:', username)
      this.resolveUser({ username, isLogin: true, loginMethod: 'form' })

      // Send login event
      eventService.login()
    } catch (err) {
      // Silently ignore as mostly it's just not logged-in yet
      log.debug('Failed to get logged-in user from', PATH_USER, '-', err)
      this.resolveUser({ username: PUBLIC_USER, isLogin: false, loginMethod: 'form' })
    }
  }

  async getUsername(): Promise<string> {
    return (await this.user).username
  }

  async isLogin(): Promise<boolean> {
    return (await this.user).isLogin
  }

  async getLoginMethod(): Promise<string> {
    return (await this.user).loginMethod
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

    log.info('Log out:', login.username, ', Login method:', login.loginMethod)

    // Send logout event
    eventService.logout()

    // First, let logout hooks to log out in a special way
    for (const [name, logout] of Object.entries(this.logoutHooks)) {
      if (name !== login.loginMethod) {
        continue
      }
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
