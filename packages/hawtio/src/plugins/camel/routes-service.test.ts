import { jolokiaService } from '@hawtiosrc/plugins/shared/jolokia-service'
import { MBeanNode } from '@hawtiosrc/plugins/shared/tree'
import { parseXML } from '@hawtiosrc/util/xml'
import { cleanup, render, screen } from '@testing-library/react'
import fs from 'fs'
import path from 'path'
import React from 'react'
import { xmlNodeLocalName } from './globals'
import { IconNames } from './icons'
import { routesService } from './routes-service'

jest.mock('@hawtiosrc/plugins/shared/jolokia-service')

describe('routes-service', () => {
  let contextNode: MBeanNode
  let routesNode: MBeanNode
  let simpleRouteNode: MBeanNode

  const testRouteId = 'simple'
  const routesXmlPath = path.resolve(__dirname, 'testdata', 'camel-sample-app-routes.xml')
  const sampleRoutesXml = fs.readFileSync(routesXmlPath, { encoding: 'utf8', flag: 'r' })
  const routesDoc: XMLDocument = parseXML(sampleRoutesXml as string)
  // eslint-disable-next-line testing-library/no-node-access
  const simpleRouteXml = routesDoc.getElementById(testRouteId) as Element

  jolokiaService.execute = jest.fn(async (mbean: string, operation: string, args?: unknown[]): Promise<unknown> => {
    if (
      mbean === 'org.apache.camel:context=SampleCamel,type=context,name="SampleCamel"' &&
      operation === 'dumpRoutesAsXml()'
    ) {
      return sampleRoutesXml
    }

    return ''
  })

  beforeEach(() => {
    contextNode = new MBeanNode(null, 'sample-camel-1', true)
    contextNode.objectName = 'org.apache.camel:context=SampleCamel,type=context,name="SampleCamel"'

    routesNode = new MBeanNode(null, 'routes-2', true)
    routesNode.addProperty('type', 'routes')

    simpleRouteNode = new MBeanNode(null, testRouteId, false)

    routesNode.adopt(simpleRouteNode)
    contextNode.adopt(routesNode)
  })

  test('fetchRoutesXml', async () => {
    const xml = await routesService.fetchRoutesXml(contextNode)
    expect(xml).not.toBeNull()
  })

  test('fetchRoutesXml no mbean', async () => {
    contextNode.objectName = undefined

    await expect(() => routesService.fetchRoutesXml(contextNode)).rejects.toThrow(
      'Cannot process route xml as mbean name not available',
    )
  })

  test('fetchRoutesXml wrong mbean', async () => {
    contextNode.objectName = 'wrong:mbean:name'

    await expect(() => routesService.fetchRoutesXml(contextNode)).rejects.toThrow(
      'Failed to extract any xml from mbean: ' + contextNode.objectName,
    )
  })

  test('processRouteXml', async () => {
    const route = routesService.processRouteXml(sampleRoutesXml, simpleRouteNode)
    expect(route).not.toBeNull()
    expect((route as Element).id).toBe(testRouteId)
  })

  test('loadRouteXml', async () => {
    routesService.loadRouteXml(simpleRouteNode, simpleRouteXml)
    expect(simpleRouteNode.getProperty('xml')).toBe('    ' + simpleRouteXml.outerHTML)
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
      expect(childNode.getProperty(xmlNodeLocalName)).toBe(expected[i]?.localName)
      expect(childNode.getChildren().length).toBe(0)
      expect(childNode.icon).not.toBeNull()
      render(childNode.icon as React.ReactElement)
    }

    expect(screen.getAllByAltText(IconNames.EndpointIcon).length).toBe(3)
    expect(screen.getByAltText(IconNames.SetBodyIcon)).toBeInTheDocument()
    cleanup()
  })
})
