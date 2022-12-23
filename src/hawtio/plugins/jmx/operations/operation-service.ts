import { jolokiaService } from '@hawtio/plugins/connect/jolokia-service'

class OperationService {
  constructor() {}

  async execute(mbean: string, operation: string, args: unknown[]): Promise<string> {
    const response = await jolokiaService.execute(mbean, operation, args)
    if (!response || response === 'null') {
      return 'Operation Succeeded!'
    }
    if (typeof response === 'string') {
      const trimmed = response.trim()
      if (trimmed === '') {
        return 'Empty string'
      }
      return trimmed
    }
    // pretty printing
    return JSON.stringify(response, null, 2)
  }
}

export const operationService = new OperationService()
