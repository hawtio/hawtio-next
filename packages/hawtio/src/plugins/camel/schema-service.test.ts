import { schemaService } from './schema-service'
import { apacheCamelModel } from '@hawtio/plugins/camel/model'

describe('schema-service', () => {
  test('lookupDefinition of routes', () => {
    const routeDefn: Record<string, unknown>|null = schemaService.lookupDefinition('routes', apacheCamelModel)
    expect(routeDefn).not.toBeNull()
    const rd: Record<string, unknown> = routeDefn as Record<string, unknown>
    expect(rd.type).toBe('object')
    expect(rd.title).toBe('Routes')
    expect(rd.group).toBe('configuration')
    expect(rd.icon).toBe('generic24.png')
  })

  test('getSchema nodeId', () => {
    const routeDefn: Record<string, unknown>|null = schemaService.getSchema('routes')
    expect(routeDefn).not.toBeNull()

    const rd: Record<string, unknown> = routeDefn as Record<string, unknown>
    expect(rd.type).toBe('object')
    expect(rd.title).toBe('Routes')
    expect(rd.group).toBe('configuration')
    expect(rd.icon).toBe('generic24.png')
  })

  test('getSchema nodeDefn', () => {
    const routeDefn = {
        "type": "object",
        "title": "Routes",
        "group": "configuration",
        "icon": "generic24.png",
        "description": "A series of Camel routes",
        "acceptInput": "false",
        "acceptOutput": "false"
    }

    const rd: Record<string, unknown>|null = schemaService.getSchema(routeDefn)
    expect(rd).toBe(routeDefn)
  })
})
