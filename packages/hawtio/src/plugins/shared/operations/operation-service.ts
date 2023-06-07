import { jolokiaService } from '@hawtiosrc/plugins/connect/jolokia-service'
import { log } from '../globals'

class OperationService {
  async execute(mbean: string, operation: string, args: unknown[]): Promise<unknown> {
    log.debug('Execute:', mbean, '-', operation, '-', args)
    return jolokiaService.execute(mbean, operation, args)
  }
}

export const operationService = new OperationService()
