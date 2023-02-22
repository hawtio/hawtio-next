import { eventService } from '@hawtiosrc/core'
import { log } from './globals'

const PATH_LOGIN = 'auth/login'

const STORAGE_KEY_LOGIN = 'login'

export interface ILoginService {
  login(username: string, password: string, remember: boolean): Promise<boolean>
  getUser(): string
  rememberUser(username: string): void
  clearUser(): void
}

class LoginService implements ILoginService {
  async login(username: string, password: string, remember: boolean): Promise<boolean> {
    try {
      const res = await fetch(PATH_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        // Login failed
        log.error('Login error:', res)
        return false
      }

      const data = await res.text()
      log.debug('Server login success:', data)
      if (remember) {
        this.rememberUser(username)
      } else {
        this.clearUser()
      }
      return true
    } catch (err) {
      // System error at login
      log.error('Login error:', err)
      eventService.notify({
        type: 'danger',
        message: `Login error: ${err}`,
      })
      return false
    }
  }

  getUser(): string {
    const login = localStorage.getItem(STORAGE_KEY_LOGIN)
    if (!login) {
      return ''
    }
    return JSON.parse(login).username || ''
  }

  rememberUser(username: string) {
    localStorage.setItem(STORAGE_KEY_LOGIN, JSON.stringify({ username }))
  }

  clearUser() {
    localStorage.removeItem(STORAGE_KEY_LOGIN)
  }
}

export const loginService = new LoginService()
