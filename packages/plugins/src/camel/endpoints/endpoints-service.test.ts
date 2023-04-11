import { AttributeValues, MBeanNode, MBeanTree, jolokiaService, workspace } from '@hawtio/react'
import { isObject } from '@hawtio/react/dist/util'
import fs from 'fs'
import path from 'path'
import { camelContexts, jmxDomain } from '../globals'
import { camelTreeProcessor } from '../tree-processor'
import * as es from './endpoints-service'

const routesXmlPath = path.resolve(__dirname, '..', 'testdata', 'camel-sample-app-routes.xml')
const sampleRoutesXml = fs.readFileSync(routesXmlPath, { encoding: 'utf8', flag: 'r' })

jest.mock('@hawtio/react', () => {
  const originalModule = jest.requireActual('@hawtio/react')
  return {
    __esModule: true,
    ...originalModule,
    jolokiaService: jest.fn(),
  }
})
jolokiaService.execute = jest.fn(async (mbean: string, operation: string, args?: unknown[]): Promise<unknown> => {
  if (
    mbean === 'org.apache.camel:context=SampleCamel,type=context,name="SampleCamel"' &&
    operation === 'dumpRoutesAsXml()'
  ) {
    return sampleRoutesXml
  }

  return ''
})

jolokiaService.readAttributes = jest.fn(async (mbean: string): Promise<AttributeValues> => {
  const values: AttributeValues = {}

  const uri = mbean.split('name=')[1].replace(/"/g, '')
  values.EndpointUri = uri
  values.state = 'started'

  return Promise.resolve(values)
})

// TODO: Skip tests as they don't work in a separated package. Should be fixed to make them work.
describe.skip('endpoints-service', () => {
  let tree: MBeanTree

  beforeAll(async () => {
    tree = await workspace.getTree()
    camelTreeProcessor(tree)
  })

  test('getEndpoints', async () => {
    const contextNode = tree.navigate(jmxDomain, camelContexts, 'SampleCamel') as MBeanNode
    expect(contextNode).not.toBeNull()

    const endPoints = await es.getEndpoints(contextNode)
    expect(endPoints).not.toBeNull()
    expect(endPoints.length === 4).toBeTruthy()
    for (const ep of endPoints) {
      expect(ep.uri).not.toBeNull()
      expect(ep.state).not.toBeNull()
      expect(ep.mbean).not.toBeNull()
    }
  })

  test('loadEndpointSchema', async () => {
    const contextNode = tree.navigate(jmxDomain, camelContexts, 'SampleCamel') as MBeanNode
    expect(contextNode).not.toBeNull()

    const timerSchema = es.loadEndpointSchema(contextNode, 'timer') as Record<string, unknown>
    expect(timerSchema).not.toBeNull()
    expect(timerSchema['type']).toBe('object')
    expect(timerSchema['title']).toBe('Timer')
    expect(isObject(timerSchema['properties'])).toBeTruthy()
  })
})
