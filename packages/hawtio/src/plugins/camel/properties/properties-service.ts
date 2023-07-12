import { MBeanNode } from '@hawtiosrc/plugins/shared'
import { parseXML } from '@hawtiosrc/util/xml'
import { xmlNodeLocalName } from '../globals'
import { Property } from './property'

export function populateProperties(node: MBeanNode, schemaProperties: Record<string, Record<string, string>>) {
  // Extract the xml fragment from the node's property stash
  const xml = node.getProperty('xml')
  if (!xml) return

  // Extract the xml tag name from the node's property stash
  const localName = node.getProperty(xmlNodeLocalName)
  if (!localName) return

  // Parse the xml and find the root element using the localname
  const xmlDoc = parseXML(xml)
  const elements = xmlDoc.getElementsByTagName(localName)

  // Iterate the elements found (should only be 1)
  for (const element of elements) {
    // Iterate the element attributes
    for (const attribute of element.attributes) {
      // If any xml attribute has the same name as a schema property
      // then assign the schema property the value, meaning this will
      // become a defined property
      const property = schemaProperties[attribute.name]
      if (!property) continue

      property.value = attribute.value
    }
  }
}

export function getDefinedProperties(schemaProperties: Record<string, Record<string, string>>): Property[] {
  return Object.keys(schemaProperties)
    .filter(key => {
      const obj = schemaProperties[key] ?? {}
      return Object.keys(obj).includes('value')
    })
    .map(key => {
      const propertySchema = schemaProperties[key]
      const name = propertySchema?.['title'] ?? key
      return new Property(name, propertySchema?.['value'] ?? null, propertySchema?.['description'] ?? '')
    })
    .sort(Property.sortByName)
}

export function getDefaultProperties(schemaProperties: Record<string, Record<string, string>>): Property[] {
  return Object.keys(schemaProperties)
    .filter(key => {
      const obj = schemaProperties[key] ?? {}
      return !Object.keys(obj).includes('value') && Object.keys(obj).includes('defaultValue')
    })
    .map(key => {
      const propertySchema = schemaProperties[key]
      const name = propertySchema?.['title'] ?? key
      return new Property(name, propertySchema?.['defaultValue'] ?? null, propertySchema?.['description'] ?? '')
    })
    .sort(Property.sortByName)
}

export function getUndefinedProperties(schemaProperties: Record<string, Record<string, string>>): Property[] {
  return Object.keys(schemaProperties)
    .filter(key => {
      const obj = schemaProperties[key] ?? {}
      return !Object.keys(obj).includes('value') && !Object.keys(obj).includes('defaultValue')
    })
    .map(key => {
      const propertySchema = schemaProperties[key]
      const name = propertySchema?.['title'] ?? key
      return new Property(name, null, propertySchema?.['description'] ?? '')
    })
    .sort(Property.sortByName)
}
