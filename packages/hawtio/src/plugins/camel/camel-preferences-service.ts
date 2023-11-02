export type CamelOptions = {
  ignoreIdForLabel: boolean
  showInflightCounter: boolean
  maximumLabelWidth: number
  maximumTraceOrDebugBodyLength: number
  traceOrDebugIncludeStreams: boolean
  routeMetricMaximumSeconds: number
  hideOptionDocumentation: boolean
  hideOptionDefaultValue: boolean
  hideOptionUnusedValue: boolean
}

export const DEFAULT_OPTIONS: CamelOptions = {
  ignoreIdForLabel: false,
  showInflightCounter: true,
  maximumLabelWidth: 34,
  maximumTraceOrDebugBodyLength: 5000,
  traceOrDebugIncludeStreams: false,
  routeMetricMaximumSeconds: 10,
  hideOptionDocumentation: false,
  hideOptionDefaultValue: false,
  hideOptionUnusedValue: false,
} as const

export const STORAGE_KEY_CAMEL_PREFERENCES = 'camel.preferences'

export interface ICamelPreferencesService {
  loadOptions(): CamelOptions
  saveOptions(newValues: Partial<CamelOptions>): void
}

class CamelPreferencesService implements ICamelPreferencesService {
  loadOptions(): CamelOptions {
    return { ...DEFAULT_OPTIONS, ...this.loadFromStorage() }
  }

  saveOptions(newValues: Partial<CamelOptions>) {
    const toSave = { ...this.loadFromStorage(), ...newValues }
    localStorage.setItem(STORAGE_KEY_CAMEL_PREFERENCES, JSON.stringify(toSave))
  }

  private loadFromStorage(): Partial<CamelOptions> {
    const item = localStorage.getItem(STORAGE_KEY_CAMEL_PREFERENCES)
    return item ? JSON.parse(item) : {}
  }
}

export const camelPreferencesService = new CamelPreferencesService()
