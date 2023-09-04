import { DEFAULT_OPTIONS, STORAGE_KEY_PREFERENCES, logsService } from './logs-service'

describe('LogsService', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY_PREFERENCES)
  })

  test('loadOptions/saveOptions', () => {
    let options = logsService.loadOptions()
    expect(options).toEqual(DEFAULT_OPTIONS)

    logsService.saveOptions({ sortAscending: false, batchSize: 50 })
    options = logsService.loadOptions()
    expect(options).toEqual({ ...DEFAULT_OPTIONS, sortAscending: false, batchSize: 50 })
  })
})
