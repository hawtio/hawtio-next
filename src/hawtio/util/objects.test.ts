import { isObject } from './objects'

describe('objects', () => {
  test('isObject', () => {
    expect(isObject(null)).toBe(false)
    expect(isObject(1)).toBe(false)
    const obj = { a: 'x', b: 'y', c: 'z' }
    expect(isObject(obj)).toBe(true)
    const fn = () => { /* no-op */ }
    expect(isObject(fn)).toBe(true)
  })
})
