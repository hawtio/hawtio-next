import { MBeanNode } from '@hawtiosrc/plugins/shared/tree'
import * as camelService from './camel-service'
import { contextNodeType, endpointNodeType, endpointsType, jmxDomain } from './globals'

jest.mock('@hawtiosrc/plugins/connect/jolokia-service')

describe('camel-service', () => {
  test('syncChildProperties', async () => {
    const domainNode = new MBeanNode(null, jmxDomain, true)
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

    endpointsNode.setType(endpointsType)
    camelService.setDomain(endpointsNode)
    camelService.setChildProperties(endpointsNode, endpointNodeType)

    expect(endpointsNode.getType()).toBe(endpointsType)
    expect(endpointsNode.getProperty('domain')).toBe(jmxDomain)
    for (const child of endpointsNode.getChildren()) {
      expect(child.getType()).toBe(endpointNodeType)
      expect(child.getProperty('domain')).toBe(jmxDomain)
    }
  })

  test('compareVersions', () => {
    const versions = [
      { v: '2.2.0', ma: 1, mi: 0, r: 1 },
      { v: '2.2.0', ma: 2, mi: 0, r: 1 },
      { v: '2.2.0', ma: 3, mi: 0, r: -1 },
      { v: '2.2.0', ma: 2, mi: 1, r: 1 },
      { v: '2.2.0', ma: 2, mi: 2, r: 0 },
      { v: '2.2.0', ma: 2, mi: 3, r: -1 },
      { v: '2.3.4', ma: 2, mi: 3, r: 0 },
      { v: '1.2.3.4', ma: 1, mi: 2, r: 0 },
      { v: '1.2.3.4', ma: 2, mi: 2, r: -1 },
      { v: '1.2.3.4', ma: 4, mi: 2, r: -1 },
      { v: 'v1.2.3.4', ma: 0, mi: 0, r: 1 },
      { v: 'v1.2.3.4', ma: 1, mi: 0, r: -1 },
      { v: 'v1.2.3.4', ma: 2, mi: 0, r: -1 },
      { v: '2.2.3.0-alpha', ma: 1, mi: 3, r: 1 },
      { v: '2.2.3.0-alpha', ma: 2, mi: 3, r: -1 },
      { v: '2.2.3.0-alpha', ma: 2, mi: 2, r: 0 },
    ]

    for (const data of versions) {
      expect(camelService.compareVersions(data.v, data.ma, data.mi)).toEqual(data.r)
    }
  })

  test('isCamelVersionEQGT', () => {
    const ctxNode = new MBeanNode(null, 'sampleapp', true)
    camelService.setDomain(ctxNode)
    ctxNode.setType(contextNodeType)

    let versions = [
      { v: '2.12', r: false },
      { v: '2.13', r: true },
      { v: '2.14', r: true },
      { v: '2.15', r: true },
      { v: '2.16', r: true },
      { v: '2.17', r: true },
    ]
    for (const version of versions) {
      ctxNode.addProperty('version', version.v)
      expect(camelService.isCamelVersionEQGT_2_13(ctxNode)).toBe(version.r)
    }

    versions = [
      { v: '2.12', r: false },
      { v: '2.13', r: false },
      { v: '2.14', r: true },
      { v: '2.15', r: true },
      { v: '2.16', r: true },
      { v: '2.17', r: true },
    ]
    for (const version of versions) {
      ctxNode.addProperty('version', version.v)
      expect(camelService.isCamelVersionEQGT_2_14(ctxNode)).toBe(version.r)
    }

    versions = [
      { v: '2.12', r: false },
      { v: '2.13', r: false },
      { v: '2.14', r: false },
      { v: '2.15', r: true },
      { v: '2.16', r: true },
      { v: '2.17', r: true },
    ]
    for (const version of versions) {
      ctxNode.addProperty('version', version.v)
      expect(camelService.isCamelVersionEQGT_2_15(ctxNode)).toBe(version.r)
    }

    versions = [
      { v: '2.12', r: false },
      { v: '2.13', r: false },
      { v: '2.14', r: false },
      { v: '2.15', r: false },
      { v: '2.16', r: true },
      { v: '2.17', r: true },
    ]
    for (const version of versions) {
      ctxNode.addProperty('version', version.v)
      expect(camelService.isCamelVersionEQGT_2_16(ctxNode)).toBe(version.r)
    }
  })
})
