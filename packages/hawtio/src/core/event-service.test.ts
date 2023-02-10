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
})
