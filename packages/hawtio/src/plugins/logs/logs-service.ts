import { MBeanNode, jolokiaService, workspace } from '@hawtiosrc/plugins/shared'
import { log } from './globals'
import { LogEntry, LogEvent, LogFilter } from './log-entry'

export const STORAGE_KEY_PREFERENCES = 'logs.preferences'

/**
 * Logs update interval in milliseconds.
 */
export const LOGS_UPDATE_INTERVAL = 5000

export type LogsOptions = {
  sortAscending: boolean
  autoScroll: boolean
  cacheSize: number
  batchSize: number
}

export const DEFAULT_OPTIONS: LogsOptions = {
  sortAscending: true,
  autoScroll: true,
  cacheSize: 500,
  batchSize: 20,
} as const

type LogQueryResponse = {
  events: LogEvent[]
  fromTimestamp: number
  toTimestamp: number
  host: string | null
}

export type LogQueryResult = {
  logs: LogEntry[]
  timestamp: number
}

export const LOG_QUERY_OPERATIONS = {
  getLogResults: 'getLogResults(int)',
  jsonQueryLogResults: 'jsonQueryLogResults(java.lang.String)',
} as const

export interface ILogsService {
  isActive(): Promise<boolean>
  loadLogs(): Promise<LogQueryResult>
  loadLogsAfter(afterTimestamp: number): Promise<LogQueryResult>
  append(logs: LogEntry[], newLogs: LogEntry[]): LogEntry[]
  filter(logs: LogEntry[], filter: LogFilter): LogEntry[]

  loadOptions(): LogsOptions
  saveOptions(value: Partial<LogsOptions>): void
}

class LogsService implements ILogsService {
  private async getLogQueryMBean(): Promise<MBeanNode | null> {
    const mbeans = await workspace.findMBeans('hawtio', { type: 'LogQuery' })
    if (mbeans.length > 1) {
      log.warn('Multiple LogQuery MBeans found. Selecting the first MBean:', mbeans)
    }
    return mbeans[0] ?? null
  }

  async isActive(): Promise<boolean> {
    const logQueryMBean = await this.getLogQueryMBean()
    return logQueryMBean?.hasInvokeRights(LOG_QUERY_OPERATIONS.getLogResults) || false
  }

  loadLogs(): Promise<LogQueryResult> {
    const { cacheSize } = this.loadOptions()
    return this.invokeLogQueryMBean(LOG_QUERY_OPERATIONS.getLogResults, cacheSize)
  }

  loadLogsAfter(afterTimestamp: number): Promise<LogQueryResult> {
    const { batchSize } = this.loadOptions()
    return this.invokeLogQueryMBean(LOG_QUERY_OPERATIONS.jsonQueryLogResults, { afterTimestamp, count: batchSize })
  }

  private async invokeLogQueryMBean(operation: string, arg: unknown): Promise<LogQueryResult> {
    const logQueryMBean = await this.getLogQueryMBean()
    if (!logQueryMBean || !logQueryMBean.objectName) {
      return { logs: [], timestamp: 0 }
    }

    const response = (await jolokiaService.execute(logQueryMBean.objectName, operation, [arg])) as LogQueryResponse
    log.debug('Response from', operation, ':', response)
    return {
      logs: response.events.map(event => new LogEntry(event)),
      timestamp: response.toTimestamp,
    }
  }

  append(logs: LogEntry[], newLogs: LogEntry[]): LogEntry[] {
    const appended = [...logs, ...newLogs]

    const { cacheSize } = this.loadOptions()
    if (appended.length > cacheSize) {
      appended.splice(0, logs.length - cacheSize)
    }

    return appended
  }

  filter(logs: LogEntry[], filter: LogFilter): LogEntry[] {
    let filteredLogs = logs.filter(log => log.match(filter))

    const { sortAscending } = this.loadOptions()
    if (!sortAscending) {
      filteredLogs = filteredLogs.reverse()
    }

    return filteredLogs
  }

  loadOptions(): LogsOptions {
    const item = localStorage.getItem(STORAGE_KEY_PREFERENCES)
    const savedOptions = item ? JSON.parse(item) : {}
    return { ...DEFAULT_OPTIONS, ...savedOptions }
  }

  saveOptions(options: Partial<LogsOptions>) {
    const updated = { ...this.loadOptions(), ...options }
    localStorage.setItem(STORAGE_KEY_PREFERENCES, JSON.stringify(updated))
  }
}

export const logsService = new LogsService()
