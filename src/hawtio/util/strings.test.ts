import { toString } from './strings'

describe('strings', () => {
  test('toString', () => {
    expect(toString(null)).toEqual('{}')
    expect(toString({})).toEqual('{  }')
    const obj = { a: 'x', b: 'y', c: 'z' }
    expect(toString(obj)).toEqual('{ a: x, b: y, c: z }')
  })
})
