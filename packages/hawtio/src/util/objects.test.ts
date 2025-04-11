import { isNumber, isObject, isString, isTranslatableToNumber, roundNumber } from './objects'

describe('objects', () => {
  test('isObject', () => {
    expect(isObject(null)).toBe(false)
    expect(isObject(1)).toBe(false)
    expect(isObject(true)).toBe(false)
    expect(isObject(false)).toBe(false)
    const obj = { a: 'x', b: 'y', c: 'z' }
    expect(isObject(obj)).toBe(true)
    const fn = () => {
      /* no-op */
    }
    expect(isObject(fn)).toBe(true)
  })

  test('isString', () => {
    expect(isString(undefined)).toBe(false)
    expect(isString(null)).toBe(false)
    expect(isString(1)).toBe(false)
    expect(isString(true)).toBe(false)
    expect(isString(false)).toBe(false)
    expect(isString({})).toBe(false)
    const obj = { a: 'x', b: 'y', c: 'z' }
    expect(isString(obj)).toBe(false)
    const fn = () => {
      /* no-op */
    }
    expect(isString(fn)).toBe(false)
    expect(isString('')).toBe(true)
    expect(isString('hello')).toBe(true)
  })

  test('isNumber', () => {
    expect(isNumber(0)).toBe(true)
    expect(isNumber(-1232)).toBe(true)
    expect(isNumber(324)).toBe(true)
    expect(isNumber(32.3)).toBe(true)
    expect(isNumber(-21312.4)).toBe(true)

    expect(isNumber('0')).toBe(false)
    expect(isNumber('3')).toBe(false)
    expect(isNumber('434')).toBe(false)
    expect(isNumber('-1')).toBe(false)
    expect(isNumber([])).toBe(false)
    expect(isNumber([1])).toBe(false)
    expect(isNumber({})).toBe(false)
    expect(isNumber(true)).toBe(false)
    expect(isNumber(false)).toBe(false)
    expect(isNumber(NaN)).toBe(false)
  })

  test('isTranslatableToNumber', () => {
    expect(isTranslatableToNumber(0)).toBe(true)
    expect(isTranslatableToNumber(-1232)).toBe(true)
    expect(isTranslatableToNumber(324)).toBe(true)
    expect(isTranslatableToNumber(32.3)).toBe(true)
    expect(isTranslatableToNumber(-21312.4)).toBe(true)

    expect(isTranslatableToNumber('0')).toBe(true)
    expect(isTranslatableToNumber('3')).toBe(true)
    expect(isTranslatableToNumber('434')).toBe(true)
    expect(isTranslatableToNumber('-1')).toBe(true)
    expect(isTranslatableToNumber('1.0388472')).toBe(true)

    expect(isTranslatableToNumber([])).toBe(false)
    expect(isTranslatableToNumber([1])).toBe(false)
    expect(isTranslatableToNumber({})).toBe(false)
    expect(isTranslatableToNumber(true)).toBe(false)
    expect(isTranslatableToNumber(false)).toBe(false)
    expect(isTranslatableToNumber(NaN)).toBe(false)
    expect(isTranslatableToNumber(undefined)).toBe(false)
    expect(isTranslatableToNumber(null)).toBe(false)
  })

  test('roundNumber', () => {
    expect(roundNumber(0)).toBe(0)
    expect(roundNumber(-1232)).toBe(-1232)
    expect(roundNumber(324)).toBe(324)
    expect(roundNumber(32.3)).toBe(32)
    expect(roundNumber(-21312.4)).toBe(-21312)
    expect(roundNumber(-21312.8)).toBe(-21313)

    expect(roundNumber('0')).toBe(0)
    expect(roundNumber('3')).toBe(3)
    expect(roundNumber('434')).toBe(434)
    expect(roundNumber('-1')).toBe(-1)
    expect(roundNumber('1.0388472')).toBe(1)
    expect(roundNumber('1.7388472')).toBe(2)

    expect(roundNumber(-2.43985)).toBe(-2)
    expect(roundNumber(-2.43985, 1)).toBe(-2.4)
    expect(roundNumber(-2.43985, 4)).toBe(-2.4398)
    expect(roundNumber(-2.43989, 4)).toBe(-2.4399)

    expect(roundNumber('1.3388472')).toBe(1)
    expect(roundNumber('1.3388472', 1)).toBe(1.3)
    expect(roundNumber('1.3388472', 4)).toBe(1.3388)
    expect(roundNumber('1.338899', 4)).toBe(1.3389)

    expect(roundNumber(-2.40389, 1)).toBe(-2.4)
    expect(roundNumber(-2.40389, 2)).toBe(-2.4)
    expect(roundNumber(-2.40789, 2)).toBe(-2.41)
    expect(roundNumber('1.53048472', 2)).toBe(1.53)
    expect(roundNumber('1.53048472', 3)).toBe(1.53)
    expect(roundNumber('1.53058472', 3)).toBe(1.531)

    expect(roundNumber([])).toStrictEqual([])
    expect(roundNumber([1])).toStrictEqual([1])
    expect(roundNumber({})).toStrictEqual({})
    expect(roundNumber(true)).toBe(true)
    expect(roundNumber(false)).toBe(false)
    expect(roundNumber(NaN)).toBe(NaN)
    expect(roundNumber(undefined)).toBe(undefined)
    expect(roundNumber(null)).toBe(null)
  })
})
