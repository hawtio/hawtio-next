import { schemaService } from './schema-service'
import { apacheCamelModel } from '@hawtio/plugins/camel/model'

describe('schema-service', () => {
  test('lookupDefinition of routes', () => {
    const routeDefn: any = schemaService.lookupDefinition('routes', apacheCamelModel)
    expect(routeDefn).not.toBeNull()
    expect(routeDefn.type).toBe('object')
    expect(routeDefn.title).toBe('Routes')
    expect(routeDefn.group).toBe('configuration')
    expect(routeDefn.icon).toBe('generic24.png')
  })

  test('getSchema nodeId', () => {
    const routeDefn: any = schemaService.getSchema('routes')
    expect(routeDefn).not.toBeNull()
    expect(routeDefn.type).toBe('object')
    expect(routeDefn.title).toBe('Routes')
    expect(routeDefn.group).toBe('configuration')
    expect(routeDefn.icon).toBe('generic24.png')
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

    const rd: any = schemaService.getSchema(routeDefn)
    expect(rd).toBe(routeDefn)
  })
})
