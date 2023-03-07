import { emptyParent, MBeanNode } from '@hawtiosrc/plugins/shared/tree'
import { jmxDomain, endpointNodeType, endpointsType } from './globals'
import * as ccs from './camel-content-service'

jest.mock('@hawtiosrc/plugins/connect/jolokia-service')

describe('camel-content-service', () => {
  test('syncChildProperties', async () => {
    const domainNode = new MBeanNode(emptyParent, jmxDomain, jmxDomain, true)
    const endpointsNode = domainNode.create(endpointsType, true)

    const childNames = [
      'mock://result',
      'quartz://cron?cron=0%2F10+*+*+*+*+%3F',
      'quartz://simple?trigger.repeatInterval=10000',
      'stream://out',
    ]
    for (const childName of childNames) {
      endpointsNode.create(childName, false)
    }

    expect(domainNode.childCount()).toBe(1)
    expect(domainNode.getChildren()).toContain(endpointsNode)
    expect(endpointsNode.childCount()).toBe(4)

    ccs.setType(endpointsNode, endpointsType)
    ccs.setDomain(endpointsNode)
    ccs.setChildProperties(endpointsNode, endpointNodeType)

    expect(endpointsNode.getProperty('type')).toBe(endpointsType)
    expect(endpointsNode.getProperty('domain')).toBe(jmxDomain)
    for (const child of endpointsNode.getChildren()) {
      expect(child.getProperty('type')).toBe(endpointsType)
      expect(child.getProperty('domain')).toBe(jmxDomain)
    }
  })
})
