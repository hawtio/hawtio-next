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

  test('fetch user', async () => {
    // response for fetching /user
    fetchMock.mockResponse('"user1"')

    const userService = new __testing__.UserService()
    await userService.fetchUser()
    await expect(userService.getUsername()).resolves.toBe('user1')
    await expect(userService.isLogin()).resolves.toBe(true)
  })

  test('fail to fetch user', async () => {
    // error response for fetching /user
    fetchMock.mockReject(new Error('Forbidden'))

    const userService = new __testing__.UserService()
    await userService.fetchUser()
    await expect(userService.getUsername()).resolves.toBe(PUBLIC_USER)
    await expect(userService.isLogin()).resolves.toBe(false)
  })

  test('fetch user with a special hook', async () => {
    // response for fetching /user
    fetchMock.mockResponse('"user1"')

    const userService = new __testing__.UserService()
    userService.addFetchUserHook('user-service-test', async resolve => {
      resolve({ username: 'user2', isLogin: true })
      return true
    })
    await userService.fetchUser()
    await expect(userService.getUsername()).resolves.toBe('user2')
    await expect(userService.isLogin()).resolves.toBe(true)
  })
})
