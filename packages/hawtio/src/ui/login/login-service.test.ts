import fetchMock from 'jest-fetch-mock'
import { loginService } from './login-service'

describe('LoginService', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
  })

  test('loginService exists', () => {
    expect(loginService).not.toBeNull()
  })

  test('remember username', () => {
    expect(loginService.getUser()).toEqual('')
    loginService.rememberUser('test-user')
    expect(loginService.getUser()).toEqual('test-user')
    loginService.clearUser()
    expect(loginService.getUser()).toEqual('')
  })

  test('login with remembering username', async () => {
    fetchMock.mockResponse('true')

    const result = await loginService.login('test-user', 'password!', true)
    expect(result).toBe(true)
    expect(loginService.getUser()).toEqual('test-user')
  })

  test('login without remembering username', async () => {
    fetchMock.mockResponse('true')

    const result = await loginService.login('test-user', 'password!', false)
    expect(result).toBe(true)
    expect(loginService.getUser()).toEqual('')
  })
})
