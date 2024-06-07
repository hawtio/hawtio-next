import { DEFAULT_OPTIONS, STORAGE_KEY_PREFERENCES, jmxPreferencesService } from './jmx-preferences-service'

describe('JmxPreferencesService', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY_PREFERENCES)
  })

  test('loadOptions/saveOptions', () => {
    let options = jmxPreferencesService.loadOptions()
    expect(options).toEqual(DEFAULT_OPTIONS)

    jmxPreferencesService.saveOptions({ serializeLong: true })
    options = jmxPreferencesService.loadOptions()
    expect(options).toEqual({ ...DEFAULT_OPTIONS, serializeLong: true })
  })
})
