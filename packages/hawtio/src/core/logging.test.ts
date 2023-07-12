import { Logger } from './logging'

describe('Logger', () => {
  test('getAvailableChildLoggers', () => {
    expect(Logger.getChildLoggers()).toEqual([])
    expect(Logger.getAvailableChildLoggers()).toEqual([])
    Logger.get('hawtio-core-test')
    const availableLoggers = Logger.getAvailableChildLoggers()
    expect(availableLoggers).toHaveLength(1)
    expect(availableLoggers[0]?.name).toEqual('hawtio-core-test')
  })
})
