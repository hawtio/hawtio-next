import { LogEntry, LogEvent } from './log-entry'
import timezoneMock from 'timezone-mock'

describe('LogEntry', () => {
  const dummyEvent: LogEvent = {
    seq: 0,
    timestamp: '',
    level: '',
    logger: '',
    message: '',
    properties: {},
    className: null,
    containerName: null,
    exception: null,
    fileName: null,
    host: null,
    lineNumber: null,
    methodName: null,
    thread: null,
  }

  test('should read MDC properties from an event', () => {
    // given
    const event: LogEvent = {
      ...dummyEvent,
      properties: {
        'bundle.id': '123',
        'bundle.name': 'io.hawt.jmx.test.log-entry-spec',
        'bundle.version': '1.0.0',
        'maven.coordinates': 'io.hawt.jmx.test:log-entry-spec:1.0.0',
      },
    }
    const eventMDC = {
      ...event,
      ...{
        properties: {
          'custom.key1': 'custom.value1',
          'custom.key2': 'custom.value2',
          'custom.key3': 'custom.value3',
        },
      },
    }

    // when
    const resultNoMDC = new LogEntry(event)
    const resultMDC = new LogEntry(eventMDC)

    // then
    expect(resultNoMDC.hasMDCProperties).toBe(false)
    expect(resultNoMDC.mdcProperties).toEqual({})
    expect(resultMDC.hasMDCProperties).toBe(true)
    expect(resultMDC.mdcProperties).toEqual({
      'custom.key1': 'custom.value1',
      'custom.key2': 'custom.value2',
      'custom.key3': 'custom.value3',
    })
  })

  test('should return formatted timestamp', () => {
    timezoneMock.register('UTC')

    const log1 = new LogEntry({ ...dummyEvent, seq: 1693631904253 })
    expect(log1.getTimestamp()).toEqual('2023-09-02 05:18:24.253')

    const log2 = new LogEntry({ ...dummyEvent, seq: NaN, timestamp: '2023-09-02T14:18:24+09:00' })
    expect(log2.getTimestamp()).toEqual('2023-09-02 05:18:24')

    timezoneMock.unregister()
  })

  test('should match message with keyword', () => {
    const log = new LogEntry({
      ...dummyEvent,
      message: 'abcde',
    })
    expect(log.matchMessage('abc')).toBe(true)
    expect(log.matchMessage('ABC')).toBe(true)
    expect(log.matchMessage('xyz')).toBe(false)
  })

  it('should match property values with keyword', () => {
    const log = new LogEntry({
      ...dummyEvent,
      properties: {
        key1: 'ABC',
        key2: 'xyz',
        key3: '123',
      },
    })
    expect(log.matchProperties('abc')).toBe(true)
    expect(log.matchProperties('XYZ')).toBe(true)
    expect(log.matchProperties('123')).toBe(true)
    expect(log.matchProperties('key')).toBe(false)
  })
})
