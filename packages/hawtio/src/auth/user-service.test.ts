import { UserService } from './user-service'

describe('userService', () => {
  test('default user - login - logout', () => {
    const service = new UserService()
    expect(service.isLogin()).toBe(false)
    expect(service.isDefaultUser()).toBe(true)
    service.login('bob', 'password')
    expect(service.isLogin()).toBe(true)
    expect(service.isDefaultUser()).toBe(false)
    service.logout()
    expect(service.isLogin()).toBe(false)
    expect(service.isDefaultUser()).toBe(true)
  })
})
