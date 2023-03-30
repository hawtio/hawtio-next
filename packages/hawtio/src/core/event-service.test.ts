import { eventService } from './event-service'

describe('EventService', () => {
  test('notify', () => {
    eventService.onNotify(n => {
      expect(n.type).toEqual('success')
      expect(n.message).toEqual('Test message')
      expect(n.duration).toEqual(1000)
    })
    eventService.notify({
      type: 'success',
      message: 'Test message',
      duration: 1000,
    })
    expect.hasAssertions()
  })

  test('login', () => {
    const mockListener = jest.fn()
    eventService.onLogin(mockListener)
    eventService.login()
    expect(mockListener).toBeCalled()
  })

  test('logout', () => {
    const mockListener = jest.fn()
    eventService.onLogout(mockListener)
    eventService.logout()
    expect(mockListener).toBeCalled()
  })

  test('plugins updated', () => {
    const mockListener = jest.fn()
    eventService.onPluginsUpdated(mockListener)
    eventService.pluginsUpdated()
    expect(mockListener).toBeCalled()
  })
})
