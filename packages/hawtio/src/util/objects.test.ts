import { isObject, pathGet, isString } from './objects'

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

  test('pathGet', () => {
    const o = {
      a: 'a',
      b: 'b',
      c: {
        x: 'x',
        y: {
          dd: 'dd'
        },
        z: {
          aa: 'aa',
          bb: 'bb',
          cc: 'cc'
        }
      }
    }

    expect(pathGet(o, ['a'])).toBe('a')
    expect(pathGet(o, ['b'])).toBe('b')
    expect(pathGet(o, ['c', 'x'])).toBe('x')
    expect(pathGet(o, ['c', 'y'])).toStrictEqual({ dd: 'dd' })
    expect(pathGet(o, ['c', 'z', 'aa' ])).toBe('aa')
  })

  test('isString', () => {
    expect(isString(null)).toBe(false)
    expect(isString(1)).toBe(false)
    expect(isString(true)).toBe(false)
    expect(isString(false)).toBe(false)
    const obj = { a: 'x', b: 'y', c: 'z' }
    expect(isString(obj)).toBe(false)
    const fn = () => { /* no-op */ }
    expect(isString(fn)).toBe(false)
    expect(isString('hello')).toBe(true)
  })
})
