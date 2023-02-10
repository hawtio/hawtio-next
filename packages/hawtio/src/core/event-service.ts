import EventEmitter from 'eventemitter3'
import { Logger } from './logging'

const log = Logger.get('hawtio-core-event')

export type NotificationType = 'default' | 'info' | 'success' | 'warning' | 'danger'

export type Notification = {
  type: NotificationType
  message: string
  duration?: number
}

export type NotificationListener = (notification: Notification) => void

const EVENT_NOTIFY = 'hawtio:event:notify'

export interface IEventService {
  notify(notification: Notification): void
  onNotify(listener: NotificationListener): void
}

class EventService implements IEventService {
  private eventEmitter = new EventEmitter()

  notify(notification: Notification) {
    this.eventEmitter.emit(EVENT_NOTIFY, notification)
  }

  onNotify(listener: NotificationListener) {
    this.eventEmitter.on(EVENT_NOTIFY, listener)
    log.debug('Number of listeners on', EVENT_NOTIFY, '=', this.eventEmitter.listenerCount(EVENT_NOTIFY))
  }

  removeListener(listener: NotificationListener) {
    this.eventEmitter.removeListener(EVENT_NOTIFY, listener)
  }
}

export const eventService = new EventService()
