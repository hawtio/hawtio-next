import fetchMock from 'jest-fetch-mock'
import { userService, __testing__ } from './user-service'

describe('UserService', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
  })

  test('userService exists', () => {
    expect(userService).not.toBeNull()
  })

  test('default user', async () => {
    // response for fetching /user
    fetchMock.mockResponse('public')

    const userService = new __testing__.UserService()
    await expect(userService.getUsername()).resolves.toBe('public')
    await expect(userService.isLogin()).resolves.toBe(false)
  })

  test('logged in as an user', async () => {
    // response for fetching /user
    fetchMock.mockResponse('user1')

    const userService = new __testing__.UserService()
    await expect(userService.getUsername()).resolves.toBe('user1')
    await expect(userService.isLogin()).resolves.toBe(true)
  })
})
