import jsLogger, { GlobalLogger, ILogger, ILogLevel } from 'js-logger'

export const STORAGE_KEY_LOG_LEVEL = 'core.logging.logLevel'
export const STORAGE_KEY_CHILD_LOGGERS = 'core.logging.childLoggers'

interface HawtioLogger extends GlobalLogger {
  loggers: { [name: string]: ILogger }
}

interface ChildLogger {
  name: string
  filterLevel: ILogLevel
}

class HawtioLoggerImpl implements HawtioLogger {
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
  setLevel = jsLogger.setLevel
  getLevel = jsLogger.getLevel
  enabledFor = jsLogger.enabledFor

  useDefaults = jsLogger.useDefaults
  setHandler = jsLogger.setHandler
  createDefaultHandler = jsLogger.createDefaultHandler

  get(name: string): ILogger {
    const logger = jsLogger.get(name)
    this.loggers[name] = logger
    return logger
  }

  loggers: { [name: string]: ILogger } = {}

  constructor() {
    try {
      const logLevel = this.loadLogLevel()
      this.setLevel(logLevel)
    } catch (e) {
      console.error("Failed to load log level from local storage:", e)
    }

    try {
      const childLoggers = this.loadChildLoggers()
      childLoggers.forEach(logger => this.get(logger.name).setLevel(logger.filterLevel))
    } catch (e) {
      console.error("Failed to load child loggers from local storage:", e)
    }

    this.setHandler(this.createDefaultHandler())
  }

  private loadLogLevel(): ILogLevel {
    const logLevel = localStorage.getItem(STORAGE_KEY_LOG_LEVEL)
    return logLevel ? JSON.parse(logLevel) : Logger.INFO
  }

  private loadChildLoggers(): ChildLogger[] {
    const childLoggers = localStorage.getItem(STORAGE_KEY_CHILD_LOGGERS)
    return childLoggers ? JSON.parse(childLoggers) : []
  }
}

export const Logger = new HawtioLoggerImpl()
