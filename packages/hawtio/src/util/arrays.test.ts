import { compareArrays, moveElement } from './arrays'

describe('arrays', () => {
  test('moveElement', () => {
    const testArr: number[] = [2, 3, 4, 5, 1]
    moveElement(testArr, 1, 0)
    expect(testArr[0]).toEqual(1)
    expect(testArr[4]).toEqual(5)

    const testArr2: string[] = ['a', 'b', 'e', 'c', 'd']
    moveElement(testArr2, 'e', 4)
    expect(testArr2[0]).toEqual('a')
    expect(testArr2[1]).toEqual('b')
    expect(testArr2[2]).toEqual('c')
    expect(testArr2[3]).toEqual('d')
    expect(testArr2[4]).toEqual('e')
  })

  test('compareArrays', () => {
    const testArr: string[] = ['a', 'b', 'c', 'd', 'e']

    expect(compareArrays([], [])).toBeTruthy()
    expect(compareArrays(testArr, [])).toBeFalsy()
    expect(compareArrays(testArr, ['a', 'b', 'c'])).toBeFalsy()
    expect(compareArrays(testArr, ['a', 'b', 'c', 'd'])).toBeFalsy()
    expect(compareArrays(testArr, ['a', 'b', 'c', 'e', 'd'])).toBeTruthy()
    expect(compareArrays(testArr, ['e', 'd', 'c', 'b', 'a'])).toBeTruthy()
    expect(compareArrays(testArr, ['a', 'b', 'c', 'd', 'e'])).toBeTruthy()
  })
})
