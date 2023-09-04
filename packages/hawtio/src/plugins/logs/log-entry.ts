import { isEmpty } from '@hawtiosrc/util/objects'

export type LogEvent = {
  seq: number
  timestamp: string

  level: string
  logger: string
  message: string

  properties: Record<string, string>

  className: string | null
  containerName: string | null
  exception: string | null
  fileName: string | null
  host: string | null
  lineNumber: number | null
  methodName: string | null
  thread: string | null
}

export type LogFilter = {
  level: string[]
  logger: string
  message: string
  properties: string
}

export class LogEntry {
  hasOSGiProperties: boolean
  hasMDCProperties: boolean
  hasLogSourceLineHref: boolean
  mdcProperties: Record<string, string>

  constructor(readonly event: LogEvent) {
    this.hasOSGiProperties = LogEntry.hasOSGiProperties(event.properties)
    this.hasLogSourceLineHref = event.lineNumber !== null
    this.mdcProperties = LogEntry.mdcProperties(event.properties)
    this.hasMDCProperties = !isEmpty(this.mdcProperties)
  }

  private static hasOSGiProperties(properties: Record<string, string>): boolean {
    return Object.keys(properties).some(key => key.indexOf('bundle') === 0)
  }

  private static mdcProperties(properties: Record<string, string>): Record<string, string> {
    return Object.entries(properties)
      .filter(([key, _]) => !key.startsWith('bundle.') && key !== 'maven.coordinates')
      .reduce(
        (mdc, [key, value]) => {
          mdc[key] = value
          return mdc
        },
        {} as Record<string, string>,
      )
  }

  getTimestamp(): string {
    const { seq, timestamp } = this.event
    const padZero = (n: number, len = 2) => String(n).padStart(len, '0')

    // If there is a seq in the log event, then it's the timestamp with milliseconds.
    const date = seq ? new Date(seq) : new Date(timestamp)
    const year = date.getFullYear()
    const month = padZero(date.getMonth() + 1)
    const day = padZero(date.getDate())
    const hours = padZero(date.getHours())
    const minutes = padZero(date.getMinutes())
    const seconds = padZero(date.getSeconds())
    if (seq) {
      const millis = padZero(date.getMilliseconds(), 3)
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${millis}`
    } else {
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }
  }

  match(filter: LogFilter): boolean {
    const { level, logger, message, properties } = filter
    if (level.length > 0 && !level.some(l => this.event.level === l)) {
      return false
    }
    if (logger !== '' && !this.matchLogger(logger)) {
      return false
    }
    if (message !== '' && !this.matchMessage(message)) {
      return false
    }
    if (properties !== '' && !this.matchProperties(properties)) {
      return false
    }
    return true
  }

  matchLogger(keyword: string): boolean {
    const { logger } = this.event
    return logger.toLowerCase().includes(keyword.toLowerCase())
  }

  matchMessage(keyword: string): boolean {
    const { message } = this.event
    return message.toLowerCase().includes(keyword.toLowerCase())
  }

  matchProperties(keyword: string): boolean {
    const { properties } = this.event
    const lowerCaseKeyword = keyword.toLowerCase()
    return Object.values(properties).some(value => value.toLowerCase().includes(lowerCaseKeyword))
  }
}
