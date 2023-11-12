import timezoneMock from 'timezone-mock'
import { formatTimestamp } from './dates'

describe('dates', () => {
  beforeAll(() => {
    timezoneMock.register('UTC')
  })

  afterAll(() => {
    timezoneMock.unregister()
  })

  test('formatTimestamp', () => {
    expect(formatTimestamp(new Date(1693631904253))).toEqual('2023-09-02 05:18:24')
    expect(formatTimestamp(new Date(1693631904253), true)).toEqual('2023-09-02 05:18:24.253')
    expect(formatTimestamp(new Date('2023-09-02T14:18:24+09:00'))).toEqual('2023-09-02 05:18:24')
  })
})
