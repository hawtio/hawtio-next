import fetchMock from 'jest-fetch-mock'
import { PUBLIC_USER } from './globals'
import { userService, __testing__ } from './user-service'

describe('UserService', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
  })

  test('userService exists', () => {
    expect(userService).not.toBeNull()
  })

  test('log in as an user', async () => {
    // response for fetching /user
    fetchMock.mockResponse('"user1"')

    const userService = new __testing__.UserService()
    await expect(userService.getUsername()).resolves.toBe('user1')
    await expect(userService.isLogin()).resolves.toBe(true)
  })

  test('fail to login', async () => {
    // error response for fetching /user
    fetchMock.mockReject(new Error('Forbidden'))

    const userService = new __testing__.UserService()
    await expect(userService.getUsername()).resolves.toBe(PUBLIC_USER)
    await expect(userService.isLogin()).resolves.toBe(false)
  })
})
