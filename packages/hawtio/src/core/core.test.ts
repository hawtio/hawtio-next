import { importRemote } from '@module-federation/utilities'
import fetchMock from 'jest-fetch-mock'
import { hawtio } from './core'

jest.mock('@module-federation/utilities', () => ({
  importRemote: jest.fn(),
}))

const importRemoteMock = importRemote as jest.MockedFn<typeof importRemote>

describe('HawtioCore', () => {
  beforeEach(() => {
    jest.resetModules()
    fetchMock.resetMocks()
  })

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

  test('bootstrap', async () => {
    // response for fetching 'plugin'
    fetchMock.mockResponse(async req => {
      switch (req.url) {
        case 'plugin':
          return JSON.stringify([
            {
              url: 'http://localhost:3001',
              scope: 'plugin1',
              module: './plugin',
            },
          ])
        default:
          return '{}'
      }
    })
    importRemoteMock.mockResolvedValue({
      plugin: () => {
        hawtio.addPlugin({
          id: 'mock',
          title: 'Mock',
          path: 'mock',
          component: () => null,
          isActive: () => Promise.resolve(true),
        })
      },
    })

    expect(hawtio.getPlugins()).toHaveLength(0)
    hawtio.addUrl('plugin')
    await hawtio.bootstrap()
    expect(hawtio.getPlugins()).toHaveLength(1)
  })
})
