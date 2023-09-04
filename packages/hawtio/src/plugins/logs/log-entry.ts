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

export class LogEntry {
  hasOSGiProperties: boolean
  hasMDCProperties: boolean
  hasLogSourceHref: boolean
  hasLogSourceLineHref: boolean
  logSourceUrl: string
  mdcProperties: Record<string, string>

  constructor(readonly event: LogEvent) {
    this.hasOSGiProperties = LogEntry.hasOSGiProperties(event.properties)
    this.hasLogSourceHref = LogEntry.hasLogSourceHref(event.properties)
    this.hasLogSourceLineHref = event.lineNumber !== null
    this.logSourceUrl = LogEntry.getLogSourceUrl(event)
    this.mdcProperties = LogEntry.mdcProperties(event.properties)
    this.hasMDCProperties = !isEmpty(this.mdcProperties)
  }

  private static hasOSGiProperties(properties: Record<string, string>): boolean {
    return Object.keys(properties).some(key => key.indexOf('bundle') === 0)
  }

  private static hasLogSourceHref(properties: Record<string, string>): boolean {
    return properties['maven.coordinates'] !== undefined && properties['maven.coordinates'] !== ''
  }

  // TODO: need this?
  private static getLogSourceUrl(event: LogEvent): string {
    const removeQuestion = (s: string | null) => (s && s !== '?' ? s : null)
    const fileName = removeQuestion(event.fileName)
    const className = removeQuestion(event.className)
    const mavenCoords = event.properties['maven.coordinates']
    if (!fileName || !className || !mavenCoords) {
      return ''
    }

    let link = `#/source/view/${mavenCoords}/class/${className}/${fileName}`
    if (event.lineNumber) {
      link += '?line=' + event.lineNumber
    }
    return link
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
