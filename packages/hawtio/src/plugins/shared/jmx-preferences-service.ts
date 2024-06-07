export const STORAGE_KEY_PREFERENCES = 'jmx.preferences'

export type JmxOptions = {
  serializeLong: boolean
}

export const DEFAULT_OPTIONS: JmxOptions = {
  serializeLong: false,
} as const

export interface IJmxPreferencesService {
  loadOptions(): JmxOptions
  saveOptions(options: Partial<JmxOptions>): void
}

class JmxPreferencesService implements IJmxPreferencesService {
  loadOptions(): JmxOptions {
    const item = localStorage.getItem(STORAGE_KEY_PREFERENCES)
    const savedOptions = item ? JSON.parse(item) : {}
    return { ...DEFAULT_OPTIONS, ...savedOptions }
  }

  saveOptions(options: Partial<JmxOptions>) {
    const updated = { ...this.loadOptions(), ...options }
    localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(updated))
  }
}

export const jmxPreferencesService = new JmxPreferencesService()
