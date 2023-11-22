import { jolokiaService, workspace } from '@hawtiosrc/plugins'
import { HealthComponent, HealthData, JolokiaHealthData, Logger, LoggerConfiguration } from './types'

class SpringbootService {
  isActive(): Promise<boolean> {
    return workspace.treeContainsDomainAndProperties('org.springframework.boot')
  }

  async loadHealth(): Promise<HealthData> {
    const data = (await jolokiaService.execute(
      'org.springframework.boot:type=Endpoint,name=Health',
      'health',
    )) as JolokiaHealthData
    let healthComponents: HealthComponent[] = []

    healthComponents = Object.entries(data.components).map(([componentName, component]) => {
      let details

      if (component.details) {
        details = Object.entries(component.details).map(([detailKey, detailValue]) => {
          const typ = typeof detailValue
          const value = ['string', 'number', 'boolean'].includes(typ)
            ? detailValue.toString()
            : Object.entries(detailValue).map(([key, value]) => ({ key, value }))

          return {
            key: detailKey,
            value: value,
          }
        })
      }

      return {
        name: componentName,
        status: component.status,
        details: component.details ? details : undefined,
      }
    })

    return { status: data.status, components: healthComponents }
  }

  //
  // export async function getTraces:Promise<Trace[]> () {
  //   const isSb4 = true
  //   let data = {trace
  //   if(isSb4) {
  //
  //   }
  //   const data = await jolokiaService.execute('org.springframework.boot:type=Endpoint,name=Httpexchanges', 'httpExchanges')
  // }
  async getInfo() {
    const res = await jolokiaService.execute('org.springframework.boot:type=Endpoint,name=Info', 'info')
    const properties: { key: string; value: string }[] = Object.entries(res as object).map(([key, value]) => ({
      key,
      value,
    }))
    return properties
  }

  hasEndpoint(name: string): Promise<boolean> {
    return workspace.treeContainsDomainAndProperties('org.springframework.boot', { type: 'Endpoint', name: name })
  }

  async getLoggerConfiguration() {
    const data = (await jolokiaService.execute('org.springframework.boot:type=Endpoint,name=Loggers', 'loggers')) as {
      loggers: {
        [key: string]: {
          configuredLevel?: string
          effectiveLevel: string
        }
      }
      levels: string[]
    }

    const loggers: Logger[] = []

    Object.entries(data.loggers).forEach(([loggerName, loggerInfo]) => {
      const logger: Logger = {
        name: loggerName,
        configuredLevel: loggerInfo['configuredLevel'] == null ? loggerInfo.effectiveLevel : loggerInfo.configuredLevel,
        effectiveLevel: loggerInfo.effectiveLevel,
      }
      loggers.push(logger)
    })

    const loggerConfiguration: LoggerConfiguration = {
      levels: data.levels,
      loggers: loggers,
    }

    return loggerConfiguration
  }

  async configureLogLevel(loggerName: string, loggerLevel: string) {
    return await jolokiaService.execute('org.springframework.boot:type=Endpoint,name=Loggers', 'configureLogLevel', [
      loggerName,
      loggerLevel,
    ])
  }
}
export const springbootService = new SpringbootService()
