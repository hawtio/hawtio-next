import { toString, trimQuotes } from './strings'

describe('strings', () => {
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
})
