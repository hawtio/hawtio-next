export interface ICamelStorage {
  setIsHideOptionDocumentation(value: boolean): void
  loadIsHideOptionDocumentation(): boolean
  setIsHideDefaultOptionValues(value: boolean): void
  loadIsHideDefaultOptionValues(): boolean
  setIsHideUnusedOptionValues(value: boolean): void
  loadIsHideUnusedOptionValues(): boolean
  setIsIncludeTraceDebugStreams(value: boolean): void
  loadIsIncludeTraceDebugStreams(): boolean
  setMaximumTraceDebugBodyLength(value: number): void
  loadMaximumTraceDebugBodyLength(): number
  setMaximumLabelWidth(value: number): void
  loadMaximumLabelWidth(): number
  setIsIgnoreIDForLabel(value: boolean): void
  loadIsIgnoreIDForLabel(): boolean
  setIsShowInflightCounter(value: boolean): void
  loadIsShowInflightCounter(): boolean
  setRouteMetricMaximumSeconds(value: number): void
  loadRouteMetricMaximumSeconds(): number
}

export const STORAGE_KEY_IS_HIDE_OPTION_DOCUMENTATION = 'camel.preferences.isHideOptionDocumentation'
export const STORAGE_KEY_IS_HIDE_DEFAULT_OPTION_VALUES = 'camel.preferences.isHideDefaultOptionValues'
export const STORAGE_KEY_IS_HIDE_UNUSED_OPTION_VALUES = 'camel.preferences.isHideUnusedOptionValues'
export const STORAGE_KEY_IS_INCLUDE_TRACE_DEBUG_STREAMS = 'camel.preferences.isIncludeTraceDebugStreams'
export const STORAGE_KEY_MAXIMUM_TRACE_DEBUG_BODY_LENGTH = 'camel.preferences.maximumTraceDebugBodyLength'
export const STORAGE_KEY_MAXIMUM_LABEL_WIDTH = 'camel.preferences.maximumLabelWidth'
export const STORAGE_KEY_IS_IGNORE_ID_FOR_LABEL = 'camel.preferences.isIgnoreIDForLabel'
export const STORAGE_KEY_IS_SHOW_INFLIGHT_COUNTER = 'camel.preferences.isShowInflightCounter'
export const STORAGE_KEY_ROUTE_METRIC_MAXIMUM_SECONDS = 'camel.preferences.routeMetricMaximumSeconds'

const PREFERENCES_DEFAULT_VALUES: Record<string, boolean | number> = {
  [STORAGE_KEY_IS_HIDE_OPTION_DOCUMENTATION]: false,
  [STORAGE_KEY_IS_HIDE_DEFAULT_OPTION_VALUES]: false,
  [STORAGE_KEY_IS_HIDE_UNUSED_OPTION_VALUES]: false,
  [STORAGE_KEY_IS_INCLUDE_TRACE_DEBUG_STREAMS]: false,
  [STORAGE_KEY_MAXIMUM_TRACE_DEBUG_BODY_LENGTH]: 5000,
  [STORAGE_KEY_MAXIMUM_LABEL_WIDTH]: 34,
  [STORAGE_KEY_IS_IGNORE_ID_FOR_LABEL]: false,
  [STORAGE_KEY_IS_SHOW_INFLIGHT_COUNTER]: true,
  [STORAGE_KEY_ROUTE_METRIC_MAXIMUM_SECONDS]: 10,
}

class CamelPreferencesService implements ICamelStorage {
  setIsHideOptionDocumentation(value: boolean): void {
    this.saveValueToStorage(STORAGE_KEY_IS_HIDE_OPTION_DOCUMENTATION, value)
  }

  loadIsHideOptionDocumentation(): boolean {
    return this.loadFromStorage(STORAGE_KEY_IS_HIDE_OPTION_DOCUMENTATION)
  }

  setIsHideDefaultOptionValues(value: boolean): void {
    this.saveValueToStorage(STORAGE_KEY_IS_HIDE_DEFAULT_OPTION_VALUES, value)
  }

  loadIsHideDefaultOptionValues(): boolean {
    return this.loadFromStorage(STORAGE_KEY_IS_HIDE_DEFAULT_OPTION_VALUES)
  }

  setIsHideUnusedOptionValues(value: boolean): void {
    this.saveValueToStorage(STORAGE_KEY_IS_HIDE_UNUSED_OPTION_VALUES, value)
  }

  loadIsHideUnusedOptionValues(): boolean {
    return this.loadFromStorage(STORAGE_KEY_IS_HIDE_UNUSED_OPTION_VALUES)
  }

  setIsIncludeTraceDebugStreams(value: boolean): void {
    this.saveValueToStorage(STORAGE_KEY_IS_INCLUDE_TRACE_DEBUG_STREAMS, value)
  }

  loadIsIncludeTraceDebugStreams(): boolean {
    return this.loadFromStorage(STORAGE_KEY_IS_INCLUDE_TRACE_DEBUG_STREAMS)
  }

  setMaximumTraceDebugBodyLength(value: number): void {
    this.saveValueToStorage(STORAGE_KEY_MAXIMUM_TRACE_DEBUG_BODY_LENGTH, value)
  }

  loadMaximumTraceDebugBodyLength(): number {
    return this.loadFromStorage(STORAGE_KEY_MAXIMUM_TRACE_DEBUG_BODY_LENGTH)
  }

  setMaximumLabelWidth(value: number): void {
    this.saveValueToStorage(STORAGE_KEY_MAXIMUM_LABEL_WIDTH, value)
  }

  loadMaximumLabelWidth(): number {
    return this.loadFromStorage(STORAGE_KEY_MAXIMUM_LABEL_WIDTH)
  }

  setIsIgnoreIDForLabel(value: boolean): void {
    this.saveValueToStorage(STORAGE_KEY_IS_IGNORE_ID_FOR_LABEL, value)
  }

  loadIsIgnoreIDForLabel(): boolean {
    return this.loadFromStorage(STORAGE_KEY_IS_IGNORE_ID_FOR_LABEL)
  }

  setIsShowInflightCounter(value: boolean): void {
    this.saveValueToStorage(STORAGE_KEY_IS_SHOW_INFLIGHT_COUNTER, value)
  }

  loadIsShowInflightCounter(): boolean {
    return this.loadFromStorage(STORAGE_KEY_IS_SHOW_INFLIGHT_COUNTER)
  }

  setRouteMetricMaximumSeconds(value: number): void {
    this.saveValueToStorage(STORAGE_KEY_ROUTE_METRIC_MAXIMUM_SECONDS, value)
  }

  loadRouteMetricMaximumSeconds(): number {
    return this.loadFromStorage(STORAGE_KEY_ROUTE_METRIC_MAXIMUM_SECONDS)
  }

  private saveValueToStorage(storageKey: string, value: number | boolean) {
    localStorage.setItem(storageKey, JSON.stringify(value))
  }

  private loadFromStorage<T>(storageKey: string): T {
    const localStorageValue = localStorage.getItem(storageKey)

    if (!localStorageValue) return PREFERENCES_DEFAULT_VALUES[storageKey] as T
    return JSON.parse(localStorageValue) as T
  }
}

export const camelPreferencesService = new CamelPreferencesService()
