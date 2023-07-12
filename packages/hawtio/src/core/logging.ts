import { stringSorter } from '@hawtiosrc/util/strings'
import jsLogger, { GlobalLogger, ILogger, ILogLevel } from 'js-logger'
import { is, object, type } from 'superstruct'

// Necessary for external plugins to compile with --dts option
export * from 'js-logger'

export const STORAGE_KEY_LOG_LEVEL = 'core.logging.logLevel'
export const STORAGE_KEY_CHILD_LOGGERS = 'core.logging.childLoggers'

export interface HawtioLogger extends GlobalLogger {
  getChildLoggers(): ChildLogger[]
  getAvailableChildLoggers(): ChildLogger[]
  addChildLogger(logger: ChildLogger): void
  updateChildLogger(name: string, level: ILogLevel | string): void
  removeChildLogger(logger: ChildLogger): void
}

export interface ChildLogger {
  name: string
  filterLevel: ILogLevel
}

class LocalStorageHawtioLogger implements HawtioLogger {
  TRACE = jsLogger.TRACE
  DEBUG = jsLogger.DEBUG
  INFO = jsLogger.INFO
  TIME = jsLogger.TIME
  WARN = jsLogger.WARN
  ERROR = jsLogger.ERROR
  OFF = jsLogger.OFF

  trace = jsLogger.trace
  debug = jsLogger.debug
  info = jsLogger.info
  log = jsLogger.log
  warn = jsLogger.warn
  error = jsLogger.error
  time = jsLogger.time
  timeEnd = jsLogger.timeEnd
  getLevel = jsLogger.getLevel
  enabledFor = jsLogger.enabledFor

  useDefaults = jsLogger.useDefaults
  setHandler = jsLogger.setHandler
  // 'typeof jsLogger.createDefaultHandler' is a hack as otherwise tsc complains TS4029 error
  createDefaultHandler: typeof jsLogger.createDefaultHandler = jsLogger.createDefaultHandler

  private readonly LOG_LEVEL_MAP: { [name: string]: ILogLevel } = {
    TRACE: this.TRACE,
    DEBUG: this.DEBUG,
    INFO: this.INFO,
    TIME: this.TIME,
    WARN: this.WARN,
    ERROR: this.ERROR,
    OFF: this.OFF,
  } as const

  get(name: string): ILogger {
    let logger = this.loggers[name]
    if (logger) {
      return logger
    }
    logger = jsLogger.get(name)
    this.loggers[name] = logger
    return logger
  }

  setLevel(level: ILogLevel | string) {
    const logLevel = this.toLogLevel(level)
    jsLogger.setLevel(logLevel)
    this.saveLogLevel(logLevel)
  }

  private loggers: { [name: string]: ILogger } = {}

  constructor() {
    try {
      const logLevel = this.loadLogLevel()
      jsLogger.setLevel(logLevel)
    } catch (e) {
      console.error('Failed to load log level from local storage:', e)
    }

    try {
      const childLoggers = this.loadChildLoggers()
      childLoggers.forEach(logger => this.get(logger.name).setLevel(logger.filterLevel))
    } catch (e) {
      console.error('Failed to load child loggers from local storage:', e)
    }

    this.setHandler(this.createDefaultHandler())
  }

  private toLogLevel(level: ILogLevel | string): ILogLevel {
    if (typeof level !== 'string') {
      return level
    }

    const logLevel = this.LOG_LEVEL_MAP[level]
    if (!logLevel) {
      console.error('Unknown log level:', level)
      return this.INFO
    }
    return logLevel
  }

  private loadLogLevel(): ILogLevel {
    const logLevel = localStorage.getItem(STORAGE_KEY_LOG_LEVEL)
    return logLevel ? JSON.parse(logLevel) : this.INFO
  }

  private saveLogLevel(level: ILogLevel) {
    localStorage.setItem(STORAGE_KEY_LOG_LEVEL, JSON.stringify(level))
  }

  private loadChildLoggers(): ChildLogger[] {
    const childLoggers = localStorage.getItem(STORAGE_KEY_CHILD_LOGGERS)
    return childLoggers ? JSON.parse(childLoggers) : []
  }

  private saveChildLoggers(loggers: ChildLogger[]) {
    localStorage.setItem(STORAGE_KEY_CHILD_LOGGERS, JSON.stringify(loggers))
  }

  getChildLoggers(): ChildLogger[] {
    const childLoggers = this.loadChildLoggers()
    childLoggers.sort((a, b) => stringSorter(a.name, b.name))
    return childLoggers
  }

  getAvailableChildLoggers(): ChildLogger[] {
    const allLoggers: ChildLogger[] = []
    Object.values(this.loggers).forEach(logger => {
      // reflectively access 'context' property of js-logger Logger object
      if (is(logger, type({ context: object() }))) {
        allLoggers.push(logger.context as unknown as ChildLogger)
      } else {
        console.error('Logger does not have context:', logger)
      }
    })
    const childLoggers = this.getChildLoggers()
    const availableLoggers = allLoggers.filter(logger => !childLoggers.some(l => l.name === logger.name))
    availableLoggers.sort((a, b) => stringSorter(a.name, b.name))
    return availableLoggers
  }

  addChildLogger(logger: ChildLogger): void {
    const childLoggers = this.getChildLoggers()
    childLoggers.push(logger)
    this.saveChildLoggers(childLoggers)
    this.get(logger.name).setLevel(logger.filterLevel)
  }

  updateChildLogger(name: string, level: ILogLevel | string): void {
    const logLevel = this.toLogLevel(level)
    const updated = this.getChildLoggers().map(logger => {
      if (logger.name === name) {
        logger.filterLevel = logLevel
      }
      return logger
    })
    this.saveChildLoggers(updated)
    this.get(name).setLevel(logLevel)
  }

  removeChildLogger(logger: ChildLogger) {
    const removed = this.getChildLoggers().filter(l => l.name !== logger.name)
    this.saveChildLoggers(removed)
    this.get(logger.name).setLevel(this.getLevel())
  }
}

/**
 * Hawtio logger
 */
export const Logger = new LocalStorageHawtioLogger()
