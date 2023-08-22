import { jolokiaService } from '@hawtiosrc/plugins/shared/jolokia-service'
import fetchMock from 'jest-fetch-mock'
import { isActive } from './init'

jest.mock('@hawtiosrc/plugins/shared/jolokia-service')

describe('isActive', () => {
  beforeEach(() => {
    jest.resetModules()
    fetchMock.resetMocks()
  })

  test('/proxy/enabled returns false', async () => {
    fetchMock.mockResponse('   false   \n')

    await expect(isActive()).resolves.toEqual(false)
  })

  test('/proxy/enabled returns not false & jolokia url is null', async () => {
    fetchMock.mockResponse('true')
    jolokiaService.getJolokiaUrl = jest.fn(async () => null)

    await expect(isActive()).resolves.toEqual(true)
  })

  test('/proxy/enabled returns not false & jolokia url is not null', async () => {
    fetchMock.mockResponse('')
    jolokiaService.getJolokiaUrl = jest.fn(async () => 'test-url')

    await expect(isActive()).resolves.toEqual(false)
  })
})
