import { camelTreeProcessor } from '@hawtiosrc/plugins/camel/tree-processor'
import { AttributeValues, MBeanNode, MBeanTree, jolokiaService, workspace } from '@hawtiosrc/plugins/shared'
import fs from 'fs'
import path from 'path'
import { camelContexts, jmxDomain } from '../globals'
import { ConditionalBreakpoint, debugService as ds } from './debug-service'

const routesXmlPath = path.resolve(__dirname, '..', 'testdata', 'camel-sample-app-routes.xml')
const sampleRoutesXml = fs.readFileSync(routesXmlPath, { encoding: 'utf8', flag: 'r' })

const camelCtx = 'org.apache.camel:context=SampleCamel,type=context,name="SampleCamel"'
const debuggerCtx = 'org.apache.camel:context=SampleCamel,type=tracer,name=BacklogDebugger'
let debuggingEnabled = true
let breakpointIds = ['bkp1', 'bkp2', 'bkp3']
const newBkp = 'bkp4'

jest.mock('@hawtiosrc/plugins/shared/jolokia-service')

jolokiaService.execute = jest.fn(async (mbean: string, operation: string, args?: unknown[]): Promise<unknown> => {
  if (mbean === camelCtx && operation === 'dumpRoutesAsXml()') return sampleRoutesXml

  if (mbean === debuggerCtx && operation === 'getBreakpoints') return breakpointIds

  if (mbean === debuggerCtx && operation === 'addBreakpoint') breakpointIds.push(newBkp)

  if (mbean === debuggerCtx && operation === 'addConditionalBreakpoint') breakpointIds.push(newBkp)

  if (mbean === debuggerCtx && operation === 'removeBreakpoint')
    breakpointIds = breakpointIds.filter(value => value !== newBkp)

  return ''
})

jolokiaService.readAttributes = jest.fn(async (mbean: string): Promise<AttributeValues> => {
  const values: AttributeValues = {}

  const uri = mbean.split('name=')[1]?.replace(/"/g, '')
  values.EndpointUri = uri
  values.state = 'started'

  return Promise.resolve(values)
})

jolokiaService.readAttribute = jest.fn(async (mbean: string, attribute: string): Promise<unknown> => {
  if (mbean === debuggerCtx && attribute === 'Enabled') return Promise.resolve(debuggingEnabled)

  return Promise.resolve(attribute)
})

describe('debug-service', () => {
  let tree: MBeanTree

  beforeAll(async () => {
    tree = await workspace.getTree()
    camelTreeProcessor(tree)
  })

  beforeEach(async () => {
    debuggingEnabled = true
    breakpointIds = ['bkp1', 'bkp2', 'bkp3']
  })

  test('getDebugBean', async () => {
    const contextNode = tree.navigate(jmxDomain, camelContexts, 'SampleCamel') as MBeanNode
    expect(contextNode).not.toBeNull()

    const debugBean = ds.getDebugBean(contextNode)
    expect(debugBean).not.toBeNull()
    expect(debugBean?.objectName).toEqual('org.apache.camel:context=SampleCamel,type=tracer,name=BacklogDebugger')
  })

  test('isDebugging', async () => {
    const contextNode = tree.navigate(jmxDomain, camelContexts, 'SampleCamel') as MBeanNode
    expect(contextNode).not.toBeNull()

    let debugging = await ds.isDebugging(contextNode)
    expect(debugging).toBeTruthy()

    debuggingEnabled = false
    debugging = await ds.isDebugging(contextNode)
    expect(debugging).toBeFalsy()
  })

  test('getBreakpoints', async () => {
    const contextNode = tree.navigate(jmxDomain, camelContexts, 'SampleCamel') as MBeanNode
    expect(contextNode).not.toBeNull()

    const bkps = await ds.getBreakpoints(contextNode)
    expect(bkps.length).toEqual(3)
    expect(bkps.toString()).toEqual(breakpointIds.toString())
  })

  test('addBreakpoint', async () => {
    const contextNode = tree.navigate(jmxDomain, camelContexts, 'SampleCamel') as MBeanNode
    expect(contextNode).not.toBeNull()

    const result = await ds.addBreakpoint(contextNode, newBkp)
    expect(result).toBeTruthy()
    expect(breakpointIds.includes(newBkp)).toBeTruthy()
  })

  test('removeBreakpoint', async () => {
    const contextNode = tree.navigate(jmxDomain, camelContexts, 'SampleCamel') as MBeanNode
    expect(contextNode).not.toBeNull()

    breakpointIds.push(newBkp)
    const result = await ds.removeBreakpoint(contextNode, newBkp)
    expect(result).toBeTruthy()
    expect(breakpointIds.includes(newBkp)).toBeFalsy()
  })

  test('addConditionalBreakpoint', async () => {
    const contextNode = tree.navigate(jmxDomain, camelContexts, 'SampleCamel') as MBeanNode
    expect(contextNode).not.toBeNull()

    const cb: ConditionalBreakpoint = {
      nodeId: 'bkp4',
      language: 'simple',
      // eslint-disable-next-line no-template-curly-in-string
      predicate: "${body} != 'bkp4'",
    }

    const result = await ds.addConditionalBreakpoint(contextNode, cb)
    expect(result).toBeTruthy()
    expect(breakpointIds.includes(newBkp)).toBeTruthy()
  })
})
