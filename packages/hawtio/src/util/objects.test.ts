import { isObject, isString } from './objects'

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
    expect(isString(null)).toBe(false)
    expect(isString(1)).toBe(false)
    expect(isString(true)).toBe(false)
    expect(isString(false)).toBe(false)
    const obj = { a: 'x', b: 'y', c: 'z' }
    expect(isString(obj)).toBe(false)
    const fn = () => {
      /* no-op */
    }
    expect(isString(fn)).toBe(false)
    expect(isString('hello')).toBe(true)
  })
})
