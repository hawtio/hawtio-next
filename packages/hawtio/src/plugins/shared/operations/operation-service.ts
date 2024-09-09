import { jolokiaService } from '@hawtiosrc/plugins/shared/jolokia-service'
import { escapeMBean } from '@hawtiosrc/util/jolokia'
import { SimpleRequestOptions } from '@jolokia.js/simple'
import { log } from '../globals'
import { jmxPreferencesService } from '../jmx-preferences-service'

class OperationService {
  private requestOptions(): SimpleRequestOptions {
    const { serializeLong } = jmxPreferencesService.loadOptions()
    return serializeLong ? { serializeLong: 'string' } : {}
  }

  async execute(mbean: string, operation: string, args: unknown[]): Promise<unknown> {
    log.debug('Execute:', mbean, '-', operation, '-', args)
    return jolokiaService.execute(mbean, operation, args, this.requestOptions())
  }

  async getJolokiaUrl(mbean: string, operation: string): Promise<string> {
    const mbeanName = escapeMBean(mbean)
    const jolokiaUrl = await jolokiaService.getFullJolokiaUrl()
    return `${jolokiaUrl}/exec/${mbeanName}/${operation}`
  }
}

export const operationService = new OperationService()
