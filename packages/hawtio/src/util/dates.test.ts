import timezoneMock from 'timezone-mock'
import { formatTimestamp, humanizeSeconds } from './dates'

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

  test('humanizeSeconds', () => {
    expect(humanizeSeconds(1)).toEqual('1 second')
    expect(humanizeSeconds(10)).toEqual('10 seconds')

    expect(humanizeSeconds(60)).toEqual('1 minute')
    expect(humanizeSeconds(90)).toEqual('1.5 minutes')
    expect(humanizeSeconds(120)).toEqual('2 minutes')
    expect(humanizeSeconds(200)).toEqual('3.3 minutes')

    expect(humanizeSeconds(60 * 60)).toEqual('1 hour')
    expect(humanizeSeconds(90 * 60)).toEqual('1.5 hours')
    expect(humanizeSeconds(120 * 60)).toEqual('2 hours')
    expect(humanizeSeconds(200 * 60)).toEqual('3.3 hours')

    expect(humanizeSeconds(24 * 60 * 60)).toEqual('1 day')
    expect(humanizeSeconds(36 * 60 * 60)).toEqual('1.5 days')
    expect(humanizeSeconds(48 * 60 * 60)).toEqual('2 days')
    expect(humanizeSeconds(80 * 60 * 60)).toEqual('3.3 days')
  })
})
