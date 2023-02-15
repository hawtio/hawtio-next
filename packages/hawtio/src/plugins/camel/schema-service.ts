import { apacheCamelModel } from '@hawtio/plugins/camel/model'
import { isObject, isString } from '@hawtio/util/objects'
import clone from 'clone'

class SchemaService {

  /**
   * Looks up the given type name in the schemas definitions
   * @method lookupDefinition
   * @param {String} name
   * @param {any} schema
   */
  lookupDefinition(name: string, schema: Record<string, unknown>): Record<string, unknown>|null {
    if (!schema) return null

    if (! isObject(schema.definitions)) return null

    const defs: Record<string, unknown> = schema.definitions as Record<string, unknown>
    if (! isObject(defs[name])) return null

    const answer = defs[name] as Record<string, unknown>
    if (isObject(answer["fullSchema"])) {
      return answer["fullSchema"] as Record<string, unknown>
    }

    // we may extend another, if so we need to copy in the base properties
    let extendsTypes: string[] = []
    if (answer?.extends) {
      extendsTypes.push('extends')
    }
    if (answer?.type) {
      extendsTypes.push('type')
    }
    if (extendsTypes.length === 0) return answer

    const fullSchema = clone(answer)
    fullSchema.properties = fullSchema.properties || {}
    for (const extendType of extendsTypes) {
      const extendDef = this.lookupDefinition((fullSchema[extendType] as string), schema)
      const properties = extendDef?.properties
      if (isObject(properties)) {
        for (const [key, property] of Object.entries(properties)) {
          const fp: Record<string, unknown> = fullSchema.properties as Record<string, unknown>
          fp[key] = property
        }
      }
    }
    answer["fullSchema"] = fullSchema
    return fullSchema
  }

  getSchema(nodeIdOrDefinition: Record<string, unknown>|string): Record<string, unknown>|null {
    if (typeof nodeIdOrDefinition === 'string' || nodeIdOrDefinition instanceof String)
      return this.lookupDefinition(nodeIdOrDefinition as string, apacheCamelModel)
    else
      return nodeIdOrDefinition
  }
}

export const schemaService = new SchemaService()
