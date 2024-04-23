import Logger, { ILogLevel } from 'js-logger'

Logger.useDefaults()

export const log = Logger.get('hawtio-backend')

export function configureLog(logLevel: ILogLevel | string = Logger.INFO) {
  if (typeof logLevel === 'string') {
    log.setLevel((Logger as unknown as { [key: string]: ILogLevel })[logLevel.toUpperCase()])
  } else {
    log.setLevel(logLevel)
  }
  log.info('Logging level:', log.getLevel().name)
}
