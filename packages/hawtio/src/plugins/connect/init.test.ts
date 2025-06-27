import fetchMock from 'jest-fetch-mock'
import { IConnectService } from '@hawtiosrc/plugins'

jest.mock('@hawtiosrc/plugins/shared/connect-service')

describe('isActive', () => {
  let isActive: () => Promise<boolean>
  let connectService: IConnectService

  beforeEach(async () => {
    // this works only with require() and import(). doesn't work with static import
    fetchMock.resetMocks()
    jest.resetModules()

    // to ensure that connectService which we import here with import() and "./init" imports statically are
    // the same, we have to do some little JS magic
    isActive = (await import('./init')).isActive
    connectService = (await import('@hawtiosrc/plugins/shared/connect-service')).connectService
  })

  test('/proxy/enabled returns false', async () => {
    fetchMock.mockResponse('   false   \n')

    // const { isActive } = await import("./init")
    await expect(isActive()).resolves.toEqual(false)
  })

  test('/proxy/enabled returns not false & connection name is not set', async () => {
    fetchMock.mockResponse('true')
    connectService.getCurrentConnectionId = jest.fn(() => null)

    // const { isActive } = await import("./init")
    await expect(isActive()).resolves.toEqual(true)
  })

  test('/proxy/enabled returns true & connection name is set', async () => {
    fetchMock.mockResponse('true')
    connectService.getCurrentConnectionId = jest.fn(() => 'test-connection')

    await expect(isActive()).resolves.toEqual(false)
  })
})
