import { IRequest, IResponseFn, ISimpleOptions } from 'jolokia.js'
import { AttributeValues, IJolokiaService } from '../jolokia-service'
import jolokiaResponse from './jolokia-data.json'

class MockJolokiaService implements IJolokiaService {
  constructor() {
    console.log('Using mock jolokia service')
  }

  async getJolokiaUrl(): Promise<string | null> {
    return null
  }

  async list(options: ISimpleOptions): Promise<unknown> {
    return jolokiaResponse
  }

  async read(mbean: string, attribute?: string | undefined): Promise<AttributeValues> {
    return {}
  }

  async execute(mbean: string, operation: string, args?: unknown[] | undefined): Promise<unknown> {
    return {}
  }

  async register(request: IRequest, callback: IResponseFn): Promise<number> {
    return 0
  }

  unregister(handle: number) {
    // no-op
  }
}

export const jolokiaService = new MockJolokiaService()
