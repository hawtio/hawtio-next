import { log } from './globals'

const STORAGE_KEY_SHOW_VERTICAL_NAV_BY_DEFAULT = 'preferences.showVerticalNavByDefault'

const SESSION_KEY_RESET_SUCCESS = 'preferences.resetSuccess'

// Storage keys are hardcoded to avoid circular dependencies between preferences and plugins
// TODO: Is there a better way to manage storage keys to preserve?
const STORAGE_KEYS_TO_PRESERVE = [
  'connect.connections',
  //'osAuthCreds',
] as const

interface IPreferencesService {
  isShowVerticalNavByDefault(): boolean
  saveShowVerticalNavByDefault(value: boolean): void
  reset(): void
  isResetSuccess(): boolean
}

class PreferencesService implements IPreferencesService {
  isShowVerticalNavByDefault(): boolean {
    const value = localStorage.getItem(STORAGE_KEY_SHOW_VERTICAL_NAV_BY_DEFAULT)
    return value ? JSON.parse(value) : true
  }

  saveShowVerticalNavByDefault(value: boolean): void {
    localStorage.setItem(STORAGE_KEY_SHOW_VERTICAL_NAV_BY_DEFAULT, JSON.stringify(value))
  }

  reset() {
    log.info('Reset preferences')

    // Backup the storage K/V pairs that are not actual preferences.
    // Ideally, the preferences would be better organised under structured keys
    // that would be provided to the preferences registry, so that a local storage
    // complete clear operation and restore of hard-coded K/V pairs could be avoided.
    const backup = STORAGE_KEYS_TO_PRESERVE.reduce(
      (acc, key) => {
        const value = localStorage.getItem(key)
        if (value) {
          acc[key] = value
        }
        return acc
      },
      {} as Record<string, string>,
    )

    localStorage.clear()

    // Restore backup
    Object.entries(backup).forEach(([key, value]) => localStorage.setItem(key, value))

    sessionStorage.setItem(SESSION_KEY_RESET_SUCCESS, 'true')
  }

  isResetSuccess(): boolean {
    const value = sessionStorage.getItem(SESSION_KEY_RESET_SUCCESS)

    // This alert is one-time only, so clean up after read every time.
    // Not cleaning up immediately because React renders twice in development env,
    // so otherwise the alert is always wiped out before real rendering.
    setTimeout(() => sessionStorage.removeItem(SESSION_KEY_RESET_SUCCESS), 1000)

    return value ? JSON.parse(value) : false
  }
}

export const preferencesService = new PreferencesService()
