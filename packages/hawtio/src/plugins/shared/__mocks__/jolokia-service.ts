import Jolokia, { ListRequestOptions, Request, Response } from 'jolokia.js'
import { AttributeValues, IJolokiaService, JolokiaListMethod, JolokiaStoredOptions } from '../jolokia-service'
import jmxCamelResponse from './jmx-camel-tree.json'
import { OptimisedJmxDomains } from '../tree'

class MockJolokiaService implements IJolokiaService {
  constructor() {
    // eslint-disable-next-line no-console
    console.log('Using mock jolokia service')
  }

  reset() {
    // no-op
  }

  getJolokia(): Promise<Jolokia> {
    return Promise.reject('Method not implemented.')
  }

  async getJolokiaUrl(): Promise<string | null> {
    return null
  }

  async getListMethod(): Promise<JolokiaListMethod> {
    return 0
  }

  async getFullJolokiaUrl(): Promise<string> {
    return ''
  }

  async list(options?: ListRequestOptions): Promise<OptimisedJmxDomains> {
    return jmxCamelResponse.domains as unknown as OptimisedJmxDomains
  }

  async sublist(paths: string | string[], options?: ListRequestOptions): Promise<OptimisedJmxDomains> {
    return jmxCamelResponse.domains as unknown as OptimisedJmxDomains
  }

  async readAttributes(mbean: string): Promise<AttributeValues> {
    return {}
  }

  async readAttribute(mbean: string, attribute: string): Promise<unknown> {
    return null
  }

  async execute(mbean: string, operation: string, args?: unknown[]): Promise<unknown> {
    return {}
  }

  async search(mbeanPattern: string): Promise<string[]> {
    return []
  }

  async bulkRequest(requests: Request[]): Promise<Response[]> {
    return []
  }

  async register(request: Request, callback: (response: Response) => void): Promise<number> {
    return 0
  }

  unregister(handle: number) {
    // no-op
  }

  loadUpdateRate(): number {
    return 0
  }

  saveUpdateRate(value: number) {
    //no-op
  }

  loadAutoRefresh(): boolean {
    return false
  }

  saveAutoRefresh(value: boolean) {
    //no-op
  }

  loadJolokiaStoredOptions(): JolokiaStoredOptions {
    return {
      maxDepth: 0,
      maxCollectionSize: 0,
    }
  }

  saveJolokiaStoredOptions(options: JolokiaStoredOptions) {
    //no-op
  }
}

export const jolokiaService = new MockJolokiaService()
