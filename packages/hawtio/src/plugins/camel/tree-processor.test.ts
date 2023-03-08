import { jolokiaService } from '@hawtiosrc/plugins/connect/jolokia-service'
import { MBeanNode, MBeanTree, workspace } from '@hawtiosrc/plugins/shared'
import {
  camelContexts,
  componentsType,
  contextNodeType,
  contextsType,
  endpointsType,
  jmxDomain,
  routesType,
  mbeansType,
  routeNodeType,
} from './globals'
import * as ccs from './camel-content-service'
import { camelTreeProcessor } from './tree-processor'
import fs from 'fs'
import path from 'path'

jest.mock('@hawtiosrc/plugins/connect/jolokia-service')

const CAMEL_MODEL_VERSION = '3.20.2'

describe('tree-processor', () => {
  let tree: MBeanTree

  const routesXmlPath = path.resolve(__dirname, 'testdata', 'camel-sample-app-routes.xml')
  const sampleRoutesXml = fs.readFileSync(routesXmlPath, { encoding: 'utf8', flag: 'r' })

  jolokiaService.execute = jest.fn(async (mbean: string, operation: string, args?: unknown[]): Promise<unknown> => {
    if (
      mbean === 'org.apache.camel:context=SampleCamel,type=context,name="SampleCamel"' &&
      operation === 'dumpRoutesAsXml()'
    ) {
      return sampleRoutesXml
    }

    return ''
  })

  jolokiaService.readAttribute = jest.fn(async (mbean: string, attribute: string): Promise<unknown> => {
    if (
      mbean === 'org.apache.camel:context=SampleCamel,type=context,name="SampleCamel"' &&
      attribute === 'CamelVersion'
    ) {
      return CAMEL_MODEL_VERSION
    }

    return ''
  })

  beforeAll(async () => {
    tree = await workspace.getTree()
  })

  test('processor', done => {
    expect(tree.isEmpty()).toBeFalsy()

    camelTreeProcessor(tree)

    /* Force a delay to allow the camel version to be retrieved */
    setTimeout(() => {
      const domainNode: MBeanNode = tree.get(jmxDomain) as MBeanNode
      expect(domainNode).not.toBeNull()
      expect(domainNode.childCount()).toBe(1)

      const contextsNode: MBeanNode = domainNode.getIndex(0) as MBeanNode
      expect(contextsNode).not.toBeNull()
      expect(ccs.hasDomain(contextsNode)).toBeTruthy()
      expect(ccs.hasType(contextsNode, contextsType)).toBeTruthy()
      expect(contextsNode.id).toBe(`${camelContexts}-1`)
      expect(contextsNode.name).toBe(camelContexts)
      expect(contextsNode.childCount()).toBe(1)

      const contextNode: MBeanNode = contextsNode.getIndex(0) as MBeanNode
      expect(ccs.hasDomain(contextNode)).toBeTruthy()
      expect(ccs.hasType(contextNode, contextNodeType)).toBeTruthy()
      expect(contextNode.id).toBe('SampleCamel-1')
      expect(contextNode.name).toBe('SampleCamel')
      expect(ccs.getCamelVersion(contextNode)).toBe(CAMEL_MODEL_VERSION)
      expect(contextNode.childCount()).toBe(4)

      const types = [routesType, endpointsType, componentsType, mbeansType]
      for (const t of types) {
        const n = contextNode.get(t) as MBeanNode
        expect(n).toBeDefined()
        expect(ccs.hasDomain(n)).toBeTruthy()
        expect(ccs.hasType(n, t)).toBeTruthy()
        expect(n.id).toMatch(new RegExp(`^${t}-[0-9]+`))
        expect(n.name).toBe(t)
        expect(ccs.getCamelVersion(n)).toBe(CAMEL_MODEL_VERSION)
        expect(n.childCount()).toBeGreaterThan(0)
      }

      const routesNode = contextNode.get(routesType) as MBeanNode
      for (const c of routesNode.getChildren()) {
        expect(c).toBeDefined()
        expect(ccs.hasDomain(c)).toBeTruthy()
        console.log('Property of ' + c.name + ' : ' + c.getProperty('type'))
        expect(ccs.hasType(c, routeNodeType)).toBeTruthy()
      }

      done()
    }, 2000)
  })
})
