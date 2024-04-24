import * as camelService from './camel-service'
import { isObject } from '@hawtiosrc/util/objects'
import fs from 'fs'
import path from 'path'
import { MBeanNode } from '../shared'
import { schemaService } from './schema-service'

describe('schema-service', () => {
  test('lookupDefinition type extends', () => {
    const schemaPath = path.resolve(__dirname, 'testdata', 'extends-type-schema.json')
    const schemaText = fs.readFileSync(schemaPath, { encoding: 'utf8', flag: 'r' })
    const schema = JSON.parse(schemaText)

    let defn: Record<string, unknown> | null = schemaService.lookupDefinition('base', schema.definitions)
    expect(defn).not.toBeNull()
    let def: Record<string, unknown> = defn as Record<string, unknown>
    expect(def.type).toBe('object')
    expect(isObject(def['properties'])).toBeTruthy()
    expect(Object.entries(def['properties'] as object).length).toBe(2)

    defn = schemaService.lookupDefinition('typed', schema.definitions)
    expect(defn).not.toBeNull()
    def = defn as Record<string, unknown>
    expect(def.type).toBe('base')
    expect(isObject(def['properties'])).toBeTruthy()
    expect(Object.entries(def['properties'] as object).length).toBe(3)

    defn = schemaService.lookupDefinition('extended', schema.definitions)
    expect(defn).not.toBeNull()
    def = defn as Record<string, unknown>
    expect(def.type).toBe('object')
    expect(isObject(def['properties'])).toBeTruthy()
    expect(Object.entries(def['properties'] as object).length).toBe(3)
  })

  test('lookupDefinition of routes', async () => {
    const node = new MBeanNode(null, 'test', true)
    const camelModel = await camelService.getCamelModel(node)
    const routeDefn = schemaService.lookupDefinition('routes', camelModel.definitions)
    expect(routeDefn).not.toBeNull()
    const rd: Record<string, unknown> = routeDefn as Record<string, unknown>
    expect(rd.type).toBe('object')
    expect(rd.title).toBe('Routes')
    expect(rd.group).toBe('configuration')
    expect(rd.icon).toBe('generic24.png')
  })

  test('getSchema nodeId', async () => {
    const node = new MBeanNode(null, 'test', true)
    const routeDefn = await schemaService.getSchema(node, 'routes')
    expect(routeDefn).not.toBeNull()

    const rd = routeDefn as Record<string, unknown>
    expect(rd.type).toBe('object')
    expect(rd.title).toBe('Routes')
    expect(rd.group).toBe('configuration')
    expect(rd.icon).toBe('generic24.png')
  })

  test('getSchema nodeDefn', async () => {
    const routeDefn = {
      type: 'object',
      title: 'Routes',
      group: 'configuration',
      icon: 'generic24.png',
      description: 'A series of Camel routes',
      acceptInput: 'false',
      acceptOutput: 'false',
    }

    const node = new MBeanNode(null, 'test', true)
    const rd = await schemaService.getSchema(node, routeDefn)
    expect(rd).toBe(routeDefn)
  })
})
