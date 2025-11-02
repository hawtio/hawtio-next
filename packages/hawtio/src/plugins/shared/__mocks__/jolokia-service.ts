import { IJolokiaSimple, SimpleRequestOptions } from '@jolokia.js/simple'
import { AttributeValues, IJolokiaService, JolokiaListMethod, JolokiaStoredOptions } from '../jolokia-service'
import { OptimisedJmxDomains } from '../tree'
import jmxCamelResponse from './jmx-camel-tree.json'
import { JolokiaErrorResponse, JolokiaRequest, JolokiaSuccessResponse, RequestOptions } from 'jolokia.js'

class MockJolokiaService implements IJolokiaService {
  constructor() {
    // eslint-disable-next-line no-console
    console.log('Using mock jolokia service')
  }

  reset() {
    // no-op
  }

  getJolokia(): Promise<IJolokiaSimple> {
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

  async list(_options?: SimpleRequestOptions): Promise<OptimisedJmxDomains> {
    return jmxCamelResponse.domains as unknown as OptimisedJmxDomains
  }

  async sublist(_paths: string | string[], _options?: SimpleRequestOptions): Promise<OptimisedJmxDomains> {
    return jmxCamelResponse.domains as unknown as OptimisedJmxDomains
  }

  async readAttributes(_mbean: string): Promise<AttributeValues> {
    return {}
  }

  async readAttribute(_mbean: string, _attribute: string): Promise<unknown> {
    return null
  }

  async readSpecifiedAttributes(_mbean: string, _attributes: string[]): Promise<AttributeValues> {
    return {}
  }

  async writeAttribute(_mbean: string, _attribute: string, _value: unknown): Promise<unknown> {
    return null
  }

  async execute(_mbean: string, _operation: string, _args?: unknown[]): Promise<unknown> {
    return {}
  }

  async search(_mbeanPattern: string): Promise<string[]> {
    return []
  }

  async bulkRequest(
    _requests: JolokiaRequest[],
    _options?: RequestOptions,
  ): Promise<(JolokiaSuccessResponse | JolokiaErrorResponse)[]> {
    return []
  }

  async register(
    _request: JolokiaRequest,
    _callback: (response: JolokiaSuccessResponse | JolokiaErrorResponse) => void,
  ): Promise<number> {
    return 0
  }

  unregister(_handle: number) {
    // no-op
  }

  loadUpdateRate(): number {
    return 0
  }

  saveUpdateRate(_value: number) {
    //no-op
  }

  loadAutoRefresh(): boolean {
    return false
  }

  saveAutoRefresh(_value: boolean) {
    //no-op
  }

  loadJolokiaStoredOptions(): JolokiaStoredOptions {
    return {
      maxDepth: 0,
      maxCollectionSize: 0,
    }
  }

  saveJolokiaStoredOptions(_options: JolokiaStoredOptions) {
    //no-op
  }
}

export const jolokiaService = new MockJolokiaService()
