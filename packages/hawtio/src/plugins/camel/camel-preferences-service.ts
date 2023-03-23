export interface ICamelStorage {
  loadIsHideOptionDocumentation(): boolean
  loadIsHideDefaultOptionValues(): boolean
  loadIsHideUnusedOptionValues(): boolean
  loadIsIncludeTraceDebugStreams(): boolean
  loadMaximumTraceDebugBodyLength(): number
  loadMaximumLabelWidth(): number
  loadIsIgnoreIDForLabel(): boolean
  loadIsShowInflightCounter(): boolean
  loadRouteMetricMaximumSeconds(): number
  loadCamelPreferences(): ICamelPreferences
  saveCamelPreferences(newValues: Partial<ICamelPreferences>): void
}

export interface ICamelPreferences {
  isHideOptionDocumentation: boolean
  isHideDefaultOptionValues: boolean
  isHideUnusedOptionValues: boolean
  isIncludeTraceDebugStreams: boolean
  maximumTraceDebugBodyLength: number
  maximumLabelWidth: number
  isIgnoreIDForLabel: boolean
  isShowInflightCounter: boolean
  routeMetricMaximumSeconds: number
}

const CAMEL_PREFERENCES_DEFAULT_VALUES: ICamelPreferences = {
  isHideOptionDocumentation: false,
  isHideDefaultOptionValues: false,
  isHideUnusedOptionValues: false,
  isIncludeTraceDebugStreams: false,
  maximumTraceDebugBodyLength: 5000,
  maximumLabelWidth: 34,
  isIgnoreIDForLabel: false,
  isShowInflightCounter: true,
  routeMetricMaximumSeconds: 10,
}

export const STORAGE_KEY_CAMEL_PREFERENCES = 'camel.preferences'

class CamelPreferencesService implements ICamelStorage {
  loadCamelPreferences(): ICamelPreferences {
    return { ...CAMEL_PREFERENCES_DEFAULT_VALUES, ...this.loadFromStorage() }
  }

  saveCamelPreferences(newValues: Partial<ICamelPreferences>): void {
    const preferencesToSave = { ...this.loadFromStorage(), ...newValues }

    localStorage.setItem(STORAGE_KEY_CAMEL_PREFERENCES, JSON.stringify(preferencesToSave))
  }

  loadIsHideOptionDocumentation(): boolean {
    return this.loadCamelPreferences().isHideOptionDocumentation
  }

  loadIsHideDefaultOptionValues(): boolean {
    return this.loadCamelPreferences().isHideDefaultOptionValues
  }

  loadIsHideUnusedOptionValues(): boolean {
    return this.loadCamelPreferences().isHideUnusedOptionValues
  }

  loadIsIncludeTraceDebugStreams(): boolean {
    return this.loadCamelPreferences().isIncludeTraceDebugStreams
  }

  loadMaximumTraceDebugBodyLength(): number {
    return this.loadCamelPreferences().maximumTraceDebugBodyLength
  }

  loadMaximumLabelWidth(): number {
    return this.loadCamelPreferences().maximumLabelWidth
  }

  loadIsIgnoreIDForLabel(): boolean {
    return this.loadCamelPreferences().isIgnoreIDForLabel
  }

  loadIsShowInflightCounter(): boolean {
    return this.loadCamelPreferences().isShowInflightCounter
  }

  loadRouteMetricMaximumSeconds(): number {
    return this.loadCamelPreferences().routeMetricMaximumSeconds
  }

  private loadFromStorage(): Partial<ICamelPreferences> {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_CAMEL_PREFERENCES) || '')
  }
}

export const camelPreferencesService = new CamelPreferencesService()
