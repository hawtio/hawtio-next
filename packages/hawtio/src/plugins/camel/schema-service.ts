import { cloneObject, isObject, isString } from '@hawtiosrc/util/objects'
import { MBeanNode } from '../shared'
import { getCamelModel } from './camel-service'

class SchemaService {
  /**
   * Looks up the given type name in the schemas definitions
   * @method lookupDefinition
   * @param {String} name
   * @param {Record<string, unknown>} definitions
   */
  lookupDefinition(name: string, definitions: Record<string, unknown>): Record<string, unknown> | null {
    if (!definitions) return null

    if (!isObject(definitions[name])) return null

    const answer = definitions[name] as Record<string, unknown>
    if (isObject(answer['fullSchema'])) {
      return answer['fullSchema'] as Record<string, unknown>
    }

    // we may extend another, if so we need to copy in the base properties
    const extendsTypes: string[] = []
    if (answer?.extends) {
      extendsTypes.push('extends')
    }
    if (answer?.type) {
      extendsTypes.push('type')
    }
    if (extendsTypes.length === 0) return answer

    const fullSchema = cloneObject(answer)
    fullSchema.properties = fullSchema.properties || {}
    for (const extendType of extendsTypes) {
      const extendDef = this.lookupDefinition(fullSchema[extendType] as string, definitions)
      const properties = extendDef?.properties
      if (isObject(properties)) {
        for (const [key, property] of Object.entries(properties)) {
          const fp: Record<string, unknown> = fullSchema.properties as Record<string, unknown>
          fp[key] = property
        }
      }
    }
    answer['fullSchema'] = fullSchema
    return fullSchema
  }

  async getSchema(
    node: MBeanNode,
    nodeIdOrDefinition: Record<string, unknown> | string,
  ): Promise<Record<string, unknown> | null> {
    if (isString(nodeIdOrDefinition)) {
      const { definitions } = await getCamelModel(node)
      return this.lookupDefinition(nodeIdOrDefinition, definitions)
    } else {
      return nodeIdOrDefinition
    }
  }
}

export const schemaService = new SchemaService()
