import EventEmitter from 'eventemitter3'
import { Logger } from './logging'

const log = Logger.get('hawtio-core-event')

export type NotificationType = 'default' | 'info' | 'success' | 'warning' | 'danger'

export type Notification = {
  type: NotificationType
  message: string
  duration?: number
}

export type EventListener = () => void
export type NotificationListener = (notification: Notification) => void

export type HawtioEvent = 'notify' | 'login' | 'logout'

export const EVENT_NOTIFY: HawtioEvent = 'notify'
export const EVENT_LOGIN: HawtioEvent = 'login'
export const EVENT_LOGOUT: HawtioEvent = 'logout'

const DEFAULT_DURATION = 8000

export interface IEventService {
  notify(notification: Notification): void
  onNotify(listener: NotificationListener): void
  login(): void
  onLogin(listener: EventListener): void
  logout(): void
  onLogout(listener: EventListener): void
}

class EventService implements IEventService {
  private eventEmitter = new EventEmitter()

  notify(notification: Notification) {
    if (!notification.duration) {
      notification.duration = DEFAULT_DURATION
    }
    this.eventEmitter.emit(EVENT_NOTIFY, notification)
  }

  onNotify(listener: NotificationListener) {
    this.eventEmitter.on(EVENT_NOTIFY, listener)
    log.debug('Number of listeners on', EVENT_NOTIFY, '=', this.eventEmitter.listenerCount(EVENT_NOTIFY))
  }

  login(): void {
    this.eventEmitter.emit(EVENT_LOGIN)
  }

  onLogin(listener: EventListener): void {
    this.eventEmitter.on(EVENT_LOGIN, listener)
  }

  logout(): void {
    this.eventEmitter.emit(EVENT_LOGOUT)
  }

  onLogout(listener: EventListener): void {
    this.eventEmitter.on(EVENT_LOGOUT, listener)
  }

  removeListener(event: HawtioEvent, listener: EventListener | NotificationListener) {
    this.eventEmitter.removeListener(event, listener)
  }
}

export const eventService = new EventService()
