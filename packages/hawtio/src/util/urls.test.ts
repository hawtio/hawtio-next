import { getQueryParameterValue } from './urls'

describe('urls', () => {
  test('getQueryParameterValue', () => {
    expect(getQueryParameterValue('http://sample.com/path?query%20key=query%21value', 'query key')).toEqual(
      'query!value',
    )
    expect(getQueryParameterValue('quartz://cron?cron=0%2F10+*+*+*+*+%3F', 'cron')).toEqual('0/10+*+*+*+*+?')
    expect(getQueryParameterValue('quartz://simple?trigger.repeatInterval=10000', 'trigger.repeatInterval')).toEqual(
      '10000',
    )
  })
})
