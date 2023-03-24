import { isString, parseBoolean, toString, trimQuotes } from './strings'

describe('strings', () => {
  test('isString', () => {
    expect(isString(undefined)).toBe(false)
    expect(isString(null)).toBe(false)
    expect(isString({})).toBe(false)
    expect(isString(true)).toBe(false)
    expect(isString(1)).toBe(false)
    expect(isString('')).toBe(true)
    expect(isString('hello!')).toBe(true)
  })

  test('toString', () => {
    expect(toString(null)).toEqual('{}')
    expect(toString({})).toEqual('{  }')
    const obj = { a: 'x', b: 'y', c: 'z' }
    expect(toString(obj)).toEqual('{ a: x, b: y, c: z }')
  })

  test('trimQuotes()', () => {
    // it should only trim enclosing quotes
    expect(trimQuotes('"0.0.0.0"')).toBe('0.0.0.0')
    expect(trimQuotes("'0.0.0.0'")).toBe('0.0.0.0')
    expect(trimQuotes("CodeHeap 'non-nmethods'")).toBe("CodeHeap 'non-nmethods'")
    expect(trimQuotes('CodeHeap "non-nmethods"')).toBe('CodeHeap "non-nmethods"')

    // it should not cause exception when null is passed
    expect(trimQuotes(null as never)).toBeNull()
  })

  test('parseBoolean()', () => {
    expect(parseBoolean('true')).toBeTruthy()
    expect(parseBoolean('TRUE')).toBeTruthy()
    expect(parseBoolean('tRuE')).toBeTruthy()
    expect(parseBoolean('1')).toBeTruthy()

    expect(parseBoolean('')).toBeFalsy()
    expect(parseBoolean('false')).toBeFalsy()
    expect(parseBoolean('FALSE')).toBeFalsy()
    expect(parseBoolean('FaLsE')).toBeFalsy()
    expect(parseBoolean('0')).toBeFalsy()
  })
})
