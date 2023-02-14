import { apacheCamelModel } from '@hawtio/plugins/camel/model'
import { pathGet, isString } from '@hawtio/util/objects'
import clone from 'clone'

class SchemaService {

  /**
   * Looks up the given type name in the schemas definitions
   * @method lookupDefinition
   * @param {String} name
   * @param {any} schema
   */
  lookupDefinition(name: string, schema: any): {}|null {
    if (!schema) return null

    const defs = schema.definitions;
    if (! defs) return null

    const answer = defs[name];
    if (! answer) return null

    let fullSchema = answer["fullSchema"];
    if (fullSchema) {
      return fullSchema;
    }

    // we may extend another, if so we need to copy in the base properties
    let extendsTypes = pathGet(answer, ["extends", "type"]);
    if (! extendsTypes) return answer

    fullSchema = clone(answer);
    fullSchema.properties = fullSchema.properties || {};
    if (extendsTypes.constructor !== Array) {
      extendsTypes = [extendsTypes];
    }
    for (let extendType in extendsTypes) {
      if (isString(extendType)) {
        var extendDef = this.lookupDefinition(extendType, schema);
        var properties = pathGet(extendDef, ["properties"]);
        if (properties) {
          for (const [key, property] of Object.entries(properties)) {
            fullSchema.properties[key] = property;
          }
        }
      }
    }
    answer["fullSchema"] = fullSchema;
    return fullSchema;
  }

  getSchema(nodeIdOrDefinition: object|string): object|null {
    if (typeof nodeIdOrDefinition === 'string' || nodeIdOrDefinition instanceof String)
      return this.lookupDefinition(nodeIdOrDefinition as string, apacheCamelModel);
    else
      return nodeIdOrDefinition
  }
}

export const schemaService = new SchemaService()
