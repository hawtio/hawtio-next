import { jolokiaService } from '@hawtiosrc/plugins/shared/jolokia-service'
import { MBeanNode, MBeanTree } from '@hawtiosrc/plugins/shared/tree'
import { parseXML } from '@hawtiosrc/util/xml'
import { render, screen } from '@testing-library/react'
import fs from 'fs'
import path from 'path'
import React from 'react'
import { contextNodeType, routeNodeType, xmlNodeLocalName } from './globals'
import { IconNames } from './icons'
import { ROUTE_OPERATIONS, routeStatsService } from './route-stats-service'
import { workspace } from '../shared'
import { camelTreeProcessor } from './tree-processor'
import { userService } from '@hawtiosrc/auth'

jest.mock('@hawtiosrc/plugins/shared/jolokia-service')

const SAMPLE_CAMEL_MBEAN = 'org.apache.camel:context=SampleCamel,type=context,name="SampleCamel"'

function mockJolokiaDumpRoutesAsXml(targetMbean: string, routesXml: string, statsXml?: string) {
  const fn = async (mbean: string, operation: string, args?: unknown[]): Promise<unknown> => {
    if (mbean !== targetMbean) return ''

    switch (operation) {
      case ROUTE_OPERATIONS.dumpRoutesAsXml:
        return routesXml
      case ROUTE_OPERATIONS.dumpRoutesStatsAsXml:
        return statsXml
      default:
        return ''
    }
  }

  return jest.fn(fn)
}

const routesXmlPath = path.resolve(__dirname, 'testdata', 'camel-sample-app-routes.xml')
const sampleRoutesXml = fs.readFileSync(routesXmlPath, { encoding: 'utf8', flag: 'r' })

describe('routes-service', () => {
  let contextNode: MBeanNode
  let routesNode: MBeanNode
  let simpleRouteNode: MBeanNode

  const testRouteId = 'simple'

  const routesDoc: XMLDocument = parseXML(sampleRoutesXml as string)
  // eslint-disable-next-line testing-library/no-node-access
  const simpleRouteXml = routesDoc.getElementById(testRouteId) as Element

  jolokiaService.execute = mockJolokiaDumpRoutesAsXml(SAMPLE_CAMEL_MBEAN, sampleRoutesXml)

  beforeEach(() => {
    contextNode = new MBeanNode(null, 'sample-camel-1', true)
    contextNode.objectName = 'org.apache.camel:context=SampleCamel,type=context,name="SampleCamel"'

    routesNode = new MBeanNode(null, 'routes-2', true)
    routesNode.addMetadata('type', 'routes')

    simpleRouteNode = new MBeanNode(null, testRouteId, false)

    routesNode.adopt(simpleRouteNode)
    contextNode.adopt(routesNode)
  })

  test('fetchRoutesXml', async () => {
    const xml = await routeStatsService.fetchRoutesXml(contextNode)
    expect(xml).not.toBeNull()
  })

  test('fetchRoutesXml no mbean', async () => {
    contextNode.objectName = undefined

    await expect(() => routeStatsService.fetchRoutesXml(contextNode)).rejects.toThrow(
      'Cannot process route xml as mbean name not available',
    )
  })

  test('fetchRoutesXml wrong mbean', async () => {
    contextNode.objectName = 'wrong:mbean:name'

    await expect(() => routeStatsService.fetchRoutesXml(contextNode)).rejects.toThrow(
      'Failed to extract any xml from mbean: ' + contextNode.objectName,
    )
  })

  test('processRouteXml', async () => {
    const route = routeStatsService.processRouteXml(sampleRoutesXml, simpleRouteNode)
    expect(route).not.toBeNull()
    expect((route as Element).id).toBe(testRouteId)
  })

  test('loadRouteXml', async () => {
    await routeStatsService.loadRouteXml(simpleRouteNode, simpleRouteXml)
    expect(simpleRouteNode.getMetadata('xml')).toBe('    ' + simpleRouteXml.outerHTML)
    expect(simpleRouteNode.childCount()).toBe(4)

    type MBeanAttr = {
      id: string
      name: string
      localName: string
      children?: MBeanAttr[]
    }

    const expected: MBeanAttr[] = [
      {
        id: 'quartz:simple?trigger.repeatInterval={{quartz.repeatInterval}}:from',
        name: 'quartz:simple?trigger.repeatInterval={{quartz.repeatInterval}}: from',
        localName: 'from',
      },
      { id: 'setBody2:setBody', name: 'setBody2: setBody', localName: 'setBody' },
      { id: 'to3:to', name: 'to3: to', localName: 'to' },
      { id: 'to4:to', name: 'to4: to', localName: 'to' },
    ]

    for (let i = 0; i < simpleRouteNode.childCount(); ++i) {
      let childNode: MBeanNode | null = simpleRouteNode.getIndex(i)
      expect(childNode).not.toBeNull()
      childNode = childNode as MBeanNode
      expect(childNode.id).toBe(expected[i]?.id)
      expect(childNode.name).toBe(expected[i]?.name)
      expect(childNode.getMetadata(xmlNodeLocalName)).toBe(expected[i]?.localName)
      expect(childNode.getChildren().length).toBe(0)
      expect(childNode.icon).not.toBeNull()
      render(childNode.icon as React.ReactElement)
    }

    expect(screen.getAllByAltText(IconNames.EndpointIcon).length).toBe(3)
    expect(screen.getByAltText(IconNames.SetBodyIcon)).toBeInTheDocument()
  })
})

describe('routes-service.dumpRoutesStatsXML', () => {
  const routesStatsXmlPath = path.resolve(__dirname, 'testdata', 'camel-routes-stats.xml')
  const sampleRoutesStatsXml = fs.readFileSync(routesStatsXmlPath, { encoding: 'utf8', flag: 'r' })

  let tree: MBeanTree

  beforeAll(async () => {
    // Set up the test to be under login state
    await userService.fetchUser()
  })

  beforeEach(async () => {
    tree = await workspace.getTree()
    workspace.refreshTree()
  })

  test('dumpRoutes', async () => {
    jolokiaService.execute = mockJolokiaDumpRoutesAsXml(SAMPLE_CAMEL_MBEAN, sampleRoutesXml, sampleRoutesStatsXml)

    expect(tree.isEmpty()).toBeFalsy()

    await camelTreeProcessor(tree)

    const contextNode = tree.find(node => {
      return node.getType() === contextNodeType && node.name === 'SampleCamel'
    }) as MBeanNode
    expect(contextNode).not.toBeNull()
    expect(contextNode.getType()).toBe(contextNodeType)

    const routesNode = contextNode.get('routes', true) as MBeanNode
    expect(routesNode).not.toBeNull()

    const cronRoute = routesNode.get('cron', false) as MBeanNode
    expect(cronRoute.getType()).toBe(routeNodeType)

    const simpleRoute = routesNode.get('simple', false) as MBeanNode
    expect(simpleRoute.getType()).toBe(routeNodeType)

    const routesXml = (await routeStatsService.dumpRoutesStatsXML(routesNode)) as string
    expect(routesXml).not.toBeNull()
    expect(routesXml).toMatch(sampleRoutesStatsXml)

    const cronRouteXml = (await routeStatsService.dumpRoutesStatsXML(cronRoute)) as string
    expect(cronRouteXml).toMatch(routesXml)

    const simpleRouteXml = (await routeStatsService.dumpRoutesStatsXML(simpleRoute)) as string
    expect(simpleRouteXml).toMatch(routesXml)
  })

  test('dumpRoutesWithGroups', async () => {
    const routesXmlWithGroupsXmlPath = path.resolve(__dirname, 'testdata', 'camel-sample-app-routes-with-groups.xml')
    const sampleRoutesWithGroupsXml = fs.readFileSync(routesXmlWithGroupsXmlPath, { encoding: 'utf8', flag: 'r' })
    jolokiaService.execute = mockJolokiaDumpRoutesAsXml(
      SAMPLE_CAMEL_MBEAN,
      sampleRoutesWithGroupsXml,
      sampleRoutesStatsXml,
    )

    expect(tree.isEmpty()).toBeFalsy()

    await camelTreeProcessor(tree)

    const contextNode = tree.find(node => {
      return node.getType() === contextNodeType && node.name === 'SampleCamel'
    }) as MBeanNode
    expect(contextNode).not.toBeNull()
    expect(contextNode.getType()).toBe(contextNodeType)

    const routesNode = contextNode.get('routes', true) as MBeanNode
    expect(routesNode).not.toBeNull()

    const group1Node = routesNode.get('group1', true) as MBeanNode
    expect(group1Node).not.toBeNull()

    const cronRoute = group1Node.get('cron', false) as MBeanNode
    expect(cronRoute.getType()).toBe(routeNodeType)

    const group2Node = routesNode.get('group2', true) as MBeanNode
    expect(group2Node).not.toBeNull()

    const simpleRoute = group2Node.get('simple', false) as MBeanNode
    expect(simpleRoute.getType()).toBe(routeNodeType)

    const routesXml = (await routeStatsService.dumpRoutesStatsXML(routesNode)) as string
    expect(routesXml).not.toBeNull()
    expect(routesXml).toMatch(sampleRoutesStatsXml)

    const cronRouteXml = (await routeStatsService.dumpRoutesStatsXML(cronRoute)) as string
    expect(cronRouteXml).toMatch(routesXml)

    const simpleRouteXml = (await routeStatsService.dumpRoutesStatsXML(simpleRoute)) as string
    expect(simpleRouteXml).toMatch(routesXml)
  })
})
