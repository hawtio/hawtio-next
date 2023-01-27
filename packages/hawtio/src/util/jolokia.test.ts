import { escapeDots } from './jolokia'

describe('jolokia', () => {
  test('escapeDots', () => {
    expect(escapeDots('java.lang')).toEqual('java-lang')
  })
})
