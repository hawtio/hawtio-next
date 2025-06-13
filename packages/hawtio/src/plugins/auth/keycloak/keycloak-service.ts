import { userService } from '@hawtiosrc/auth'
import { ResolveUser } from '@hawtiosrc/auth/user-service'
import { fetchPath } from '@hawtiosrc/util/fetch'
import { basicAuthHeaderValue, getCookie } from '@hawtiosrc/util/https'
import Keycloak, { KeycloakConfig, KeycloakInitOptions, KeycloakPkceMethod, KeycloakProfile } from 'keycloak-js'
import { UserProfile } from '../types'
import { log, PATH_KEYCLOAK_CLIENT_CONFIG, PATH_KEYCLOAK_ENABLED, PATH_KEYCLOAK_VALIDATE } from './globals'
import { configManager, TaskState } from '@hawtiosrc/core'

export type KeycloakUserProfile = UserProfile & KeycloakProfile

export type HawtioKeycloakConfig = KeycloakConfig & {
  /**
   * Hawtio custom option to instruct whether to use JAAS authentication or not.
   * Default: true
   */
  jaas?: boolean

  /**
   * The method for Proof Key Code Exchange (PKCE) to use.
   * Configuring this value enables the PKCE mechanism. Available options:
   * - "S256" - The SHA256 based PKCE method
   */
  pkceMethod?: KeycloakPkceMethod
}

export const KEYCLOAK_TOKEN_MINIMUM_VALIDITY = 5 // 5 sec.

export interface IKeycloakService {
  isKeycloakEnabled(): Promise<boolean>
  registerUserHooks(helpRegistration: () => void): void
  validateSubjectMatches(user: string): Promise<boolean>
}

class KeycloakService implements IKeycloakService {
  private readonly enabled: Promise<boolean>
  private readonly config: Promise<HawtioKeycloakConfig | null>
  private readonly keycloak: Promise<Keycloak | null>
  private readonly userProfile: Promise<KeycloakUserProfile | null>

  constructor() {
    log.debug('Initialising Keycloak')
    this.enabled = this.loadKeycloakEnabled()
    this.config = this.loadKeycloakConfig()
    this.keycloak = this.createKeycloak()
    this.userProfile = this.loadUserProfile()
  }

  private loadKeycloakEnabled(): Promise<boolean> {
    configManager.initItem("Keycloak Configuration", TaskState.started, "config")
    return fetch(PATH_KEYCLOAK_ENABLED)
        .then(response => response.ok && response.status == 200 ? response.text() : null)
        .then(data => {
          // Enable Keycloak only when explicitly enabled
          const enabled = data ? data.trim() === 'true' : false
          configManager.initItem("Keycloak Configuration", enabled ? TaskState.finished : TaskState.skipped, "config")
          log.debug('Keycloak enabled:', enabled)
          return enabled
        })
        .catch(() => {
          configManager.initItem("Keycloak Configuration", TaskState.skipped, "config")
          return false
        })
  }

  private async loadKeycloakConfig(): Promise<HawtioKeycloakConfig | null> {
    const enabled = await this.enabled
    if (!enabled) {
      return null
    }
    return fetchPath<HawtioKeycloakConfig | null>(PATH_KEYCLOAK_CLIENT_CONFIG, {
      success: (data: string) => {
        log.debug('Loaded', PATH_KEYCLOAK_CLIENT_CONFIG, ':', data)
        return JSON.parse(data)
      },
      error: () => null,
    })
  }

  private async createKeycloak(): Promise<Keycloak | null> {
    const enabled = await this.enabled
    const config = await this.config
    if (!enabled || !config) {
      log.debug('Keycloak disabled')
      return null
    }

    return new Keycloak(config)
  }

  private async loadUserProfile(): Promise<KeycloakUserProfile | null> {
    const keycloak = await this.keycloak
    if (!keycloak) {
      return null
    }

    const initOptions = await this.getKeycloakInitOptions()
    try {
      const authenticated = await keycloak.init(initOptions)
      log.debug('Initialised Keycloak: authenticated =', authenticated)
      if (!authenticated) {
        keycloak.login({ redirectUri: window.location.href })
        return null
      }

      try {
        const profile: KeycloakUserProfile = await keycloak.loadUserProfile()
        log.debug('Loaded Keycloak profile:', profile)
        profile.token = keycloak.token
        return profile
      } catch (error) {
        log.error('Failed to load user profile:', error)
      }
    } catch (error) {
      log.error('Failed to initialise Keycloak:', error)
    }
    return null
  }

  private async getKeycloakInitOptions(): Promise<KeycloakInitOptions> {
    const config = await this.config
    const pkceMethod = config?.pkceMethod
    const initOptions: KeycloakInitOptions = {
      onLoad: 'login-required',
      pkceMethod,
    }
    return initOptions
  }

  isKeycloakEnabled(): Promise<boolean> {
    return this.enabled
  }

  registerUserHooks(helpRegistration: () => void) {
    const fetchUser = async (resolve: ResolveUser) => {
      const keycloak = await this.keycloak
      const userProfile = await this.userProfile
      if (!keycloak || !userProfile) {
        return false
      }

      if (userProfile.username && userProfile.token) {
        resolve({ username: userProfile.username, isLogin: true })
        userService.setToken(userProfile.token)
      }

      this.setupFetch()

      // only now register help tab for OIDC
      helpRegistration()

      return true
    }
    userService.addFetchUserHook('keycloak', fetchUser)

    const logout = async () => {
      const keycloak = await this.keycloak
      if (!keycloak) {
        return false
      }

      log.info('Log out Keycloak')
      try {
        await keycloak.logout()
      } catch (error) {
        log.error('Error logging out Keycloak:', error)
      }
      return true
    }
    userService.addLogoutHook('keycloak', logout)
  }

  private async setupFetch() {
    const keycloak = await this.keycloak
    const config = await this.config
    if (!keycloak || !config) {
      return
    }

    log.debug('Intercept Fetch API to attach Keycloak token to authorization header')
    const { fetch: originalFetch } = window
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const logPrefix = 'Fetch -'
      log.debug(logPrefix, 'Fetch intercepted for Keycloak authentication')

      if (!keycloak.authenticated || keycloak.isTokenExpired(KEYCLOAK_TOKEN_MINIMUM_VALIDITY)) {
        log.debug(logPrefix, 'Try to update token for request:', input)
        return new Promise((resolve, reject) => {
          this.updateToken(
            token => {
              if (token) {
                log.debug(logPrefix, 'Keycloak token refreshed. Set new value to userService')
                userService.setToken(token)
              }
              log.debug(logPrefix, 'Re-sending request after successfully updating Keycloak token:', input)
              resolve(fetch(input, init))
            },
            () => {
              log.debug(logPrefix, 'Logging out due to token update failed')
              userService.logout()
              reject()
            },
          )
        })
      }

      init = { ...init }

      if (config.jaas) {
        // Use BearerTokenLoginModule on server side
        if (keycloak.profile && keycloak.profile.username && keycloak.token) {
          init.headers = {
            ...init.headers,
            Authorization: basicAuthHeaderValue(keycloak.profile.username, keycloak.token),
          }
        } else {
          log.error(logPrefix, 'Keycloak username or token not found in JAAS mode:', keycloak.profile, keycloak.token)
        }
      } else {
        // Otherwise, bearer token is used
        init.headers = {
          ...init.headers,
          Authorization: `Bearer ${keycloak.token}`,
        }
      }

      // For CSRF protection with Spring Security
      const token = getCookie('XSRF-TOKEN')
      if (token) {
        log.debug(logPrefix, 'Set XSRF token header from cookies')
        init.headers = {
          ...init.headers,
          'X-XSRF-TOKEN': token,
        }
      }

      return originalFetch(input, init)
    }
  }

  private async updateToken(successFn: (token: string) => void, errorFn?: () => void) {
    const keycloak = await this.keycloak
    if (!keycloak) {
      return
    }

    keycloak
      .updateToken(KEYCLOAK_TOKEN_MINIMUM_VALIDITY)
      .then((refreshed: boolean) => {
        if (refreshed) {
          const token = keycloak.token
          if (token) {
            successFn(token)
          }
        } else {
          log.debug('Token is still valid')
        }
      })
      .catch((reason: Error) => {
        log.error("Couldn't update token:", reason)
        errorFn?.()
      })
  }

  // TODO: validate-subject-matches
  validateSubjectMatches(user: string): Promise<boolean> {
    const url = `${PATH_KEYCLOAK_VALIDATE}?keycloakUser=${encodeURIComponent(user)}`
    return fetchPath<boolean>(url, {
      success: (data: string) => {
        log.debug('Got response for validate subject matches:', data)
        return JSON.parse(data)
      },
      error: () => false,
    })
  }
}

export const keycloakService = new KeycloakService()

// Export non-exported definitions for testing
export const __testing__ = {
  KeycloakService,
}
