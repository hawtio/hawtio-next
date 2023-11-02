import {
  CamelOptions,
  camelPreferencesService,
  DEFAULT_OPTIONS,
  STORAGE_KEY_CAMEL_PREFERENCES,
} from './camel-preferences-service'

describe('camel-preferences-service', () => {
  // Mocking local-storage is not very straightforward so we'll be using it directly
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY_CAMEL_PREFERENCES)
  })

  describe('Load preferences', () => {
    test('Retrieves default values on empty storage', () => {
      //Given
      localStorage.removeItem(STORAGE_KEY_CAMEL_PREFERENCES)

      //When
      const preferences = camelPreferencesService.loadOptions()

      //Then
      expect(preferences).toEqual(DEFAULT_OPTIONS)
    })

    test('Retrieves stored values when they is some key stored, and the default for the others', () => {
      //Given
      localStorage.setItem(STORAGE_KEY_CAMEL_PREFERENCES, JSON.stringify({ maximumLabelWidth: 5 }))

      //When
      const preferences = camelPreferencesService.loadOptions()

      //Then
      expect(preferences).toEqual({ ...DEFAULT_OPTIONS, maximumLabelWidth: 5 })
    })

    test('Retrieves all the values', () => {
      //Given
      const savedString = JSON.stringify({
        ignoreIdForLabel: true,
        showInflightCounter: true,
        traceOrDebugIncludeStreams: false,
        maximumLabelWidth: 34,
        maximumTraceOrDebugBodyLength: 134234,
        key: true,
      })
      const expected: Partial<CamelOptions> = {
        ignoreIdForLabel: true,
        maximumTraceOrDebugBodyLength: 134234,
      }
      localStorage.setItem(STORAGE_KEY_CAMEL_PREFERENCES, savedString)

      //When
      const preferences = camelPreferencesService.loadOptions()

      //Then
      expect(preferences).toMatchObject(expected)
    })
  })

  describe('Saving preferences', () => {
    test('Saving single preference', () => {
      //Given
      const savedPreference: Partial<CamelOptions> = {
        showInflightCounter: true,
      }
      const expectedString = JSON.stringify(savedPreference)

      //When
      camelPreferencesService.saveOptions(savedPreference)

      //Then
      expect(localStorage.getItem(STORAGE_KEY_CAMEL_PREFERENCES)).toEqual(expectedString)
    })

    test('Overwriting saved preferences correctly overwrites the preference', () => {
      //Given
      const savedPreference: Partial<CamelOptions> = {
        maximumLabelWidth: 5,
        showInflightCounter: true,
      }
      const overwrittenPreference: Partial<CamelOptions> = {
        maximumLabelWidth: 4,
      }
      localStorage.setItem(STORAGE_KEY_CAMEL_PREFERENCES, JSON.stringify(savedPreference))
      const expectedString = JSON.stringify({ ...savedPreference, ...overwrittenPreference })

      //When
      camelPreferencesService.saveOptions(overwrittenPreference)

      //Then
      expect(localStorage.getItem(STORAGE_KEY_CAMEL_PREFERENCES)).toEqual(expectedString)
    })
  })
})

export {}
