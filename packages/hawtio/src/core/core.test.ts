import { hawtio } from './core'

describe('HawtioCore', () => {
  test('hawtio exists', () => {
    expect(hawtio).not.toBeNull()
  })

  test('base path with empty document head', () => {
    document.head.innerHTML = ''
    expect(hawtio.getBasePath()).toBeUndefined()
  })

  test('base path with base href in document head', () => {
    document.head.innerHTML = `
      <base href='/test'/>
    `
    expect(hawtio.getBasePath()).toEqual('/test')
  })

  test('custom base path', () => {
    hawtio.setBasePath('/custom')
    expect(hawtio.getBasePath()).toEqual('/custom')
  })
})
