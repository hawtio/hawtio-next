import { IRequest, IResponseFn, ISimpleOptions } from 'jolokia.js'
import { AttributeValues, IJolokiaService } from '../jolokia-service'
import jmxCamelResponse from './jmx-camel-tree.json'
import fs from 'fs'
import path from 'path'

const routesXmlPath = path.resolve(__dirname, 'camel-sample-app-routes.xml')

const camelSampleAppRoutesXml = fs.readFileSync(routesXmlPath, {encoding:'utf8', flag:'r'})

class MockJolokiaService implements IJolokiaService {
  constructor() {
    console.log('Using mock jolokia service')
  }

  async getJolokiaUrl(): Promise<string | null> {
    return null
  }

  async list(options: ISimpleOptions): Promise<unknown> {
    return jmxCamelResponse
  }

  async readAttributes(mbean: string): Promise<AttributeValues> {
    return {}
  }

  async readAttribute(mbean: string, attribute: string): Promise<unknown> {
    return null
  }

  async execute(mbean: string, operation: string, args?: unknown[] | undefined): Promise<unknown> {
    if (mbean === 'org.apache.camel:context=SampleCamel,type=context,name="SampleCamel"' && operation === 'dumpRoutesAsXml()') {
      return camelSampleAppRoutesXml
    }

    return ''
  }

  async register(request: IRequest, callback: IResponseFn): Promise<number> {
    return 0
  }

  unregister(handle: number) {
    // no-op
  }
}

export const jolokiaService = new MockJolokiaService()
