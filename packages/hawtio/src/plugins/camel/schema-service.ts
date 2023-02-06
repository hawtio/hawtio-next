import { apacheCamelModel } from '@hawtio/plugins/camel/model'
import { isObject, pathGet, isString } from '@hawtio/util/objects'
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
    let extendsTypes = pathGet(answer, ["extends", "type"])
    if (! extendsTypes) return answer

    const fullSchema = clone(answer)
    fullSchema.properties = fullSchema.properties || {}
    if (extendsTypes.constructor !== Array) {
      extendsTypes = [extendsTypes]
    }
    for (const extendType in extendsTypes) {
      if (isString(extendType)) {
        const extendDef = this.lookupDefinition(extendType, schema)
        const properties = pathGet(extendDef, ["properties"])
        if (isObject(properties)) {
          for (const [key, property] of Object.entries(properties)) {
            const fp: Record<string, unknown> = fullSchema.properties as Record<string, unknown>
            fp[key] = property
          }
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
