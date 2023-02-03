import * as support from '@hawtio/test/support'
import { connectService } from './connect-service'
import { isActive } from './init'

jest.mock('@hawtio/plugins/connect/connect-service')

const globalFetch = global.fetch

describe('isActive', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    global.fetch = globalFetch
  })

  test('/proxy/enabled returns false', async () => {
    support.mockFetch('   false   \n')

    await expect(isActive()).resolves.toEqual(true)
  })

  test('/proxy/enabled returns not false & connection name is not set', async () => {
    support.mockFetch('true')
    connectService.getCurrentConnection = jest.fn(() => null)

    await expect(isActive()).resolves.toEqual(true)
  })

  test('/proxy/enabled returns not false & connection name is set', async () => {
    support.mockFetch('')
    connectService.getCurrentConnection = jest.fn(() => 'test-connection')

    await expect(isActive()).resolves.toEqual(false)
  })
})
