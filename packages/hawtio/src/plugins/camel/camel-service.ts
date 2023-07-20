import * as camel3 from '@hawtio/camel-model-v3'
import * as camel4 from '@hawtio/camel-model-v4'
import { eventService } from '@hawtiosrc/core'
import { MBeanNode } from '@hawtiosrc/plugins/shared'
import { jolokiaService } from '@hawtiosrc/plugins/shared/jolokia-service'
import { isObject } from '@hawtiosrc/util/objects'
import { isBlank } from '@hawtiosrc/util/strings'
import { ENDPOINT_OPERATIONS } from './endpoints/endpoints-service'
import {
  componentNodeType,
  componentsType,
  contextNodeType,
  contextsType,
  domainNodeType,
  endpointNodeType,
  endpointsType,
  jmxDomain,
  log,
  mbeansType,
  routeNodeType,
  routeXmlNodeType,
  routesType,
} from './globals'
import { ROUTE_OPERATIONS } from './routes-service'

// TODO: Should be provided by @hawtio/camel-model package
// TODO: Why are the properties redundant? (e.g. components.components, dataformats.dataformats)
export type CamelModel = {
  apacheCamelModelVersion: string
  components: { components: { [name: string]: CamelModelSchema } }
  dataformats: { dataformats: { [name: string]: CamelModelSchema } }
  definitions: { definitions: { [name: string]: CamelModelSchema } }
  languages: { languages: { [name: string]: CamelModelSchema } }
  rests: { rests: { [name: string]: CamelModelSchema } }
}

export type CamelModelSchema = {
  type: string
  title: string
  group: string
  icon: string
  description: string
  acceptInput?: string
  acceptOutput?: string
  nextSiblingAddedAsChild?: boolean
  properties: { [name: string]: CamelModelProperty }
}

export type CamelModelProperty = {
  kind: string
  type: string
  defaultValue?: string
  enum?: string[]
  description: string
  title: string
  required: boolean
  deprecated: boolean
}

export function notifyError(msg: string) {
  eventService.notify({
    type: 'danger',
    message: msg,
  })
}

export function notifyInfo(msg: string) {
  eventService.notify({
    type: 'info',
    message: msg,
  })
}

export function setChildProperties(parent: MBeanNode | null, childType: string) {
  if (!parent) return

  for (const child of parent.getChildren()) {
    child.setType(childType)
    setDomain(child)
    setChildProperties(child, childType)
  }
}

export function setDomain(node: MBeanNode) {
  node.addProperty('domain', jmxDomain)
}

export function hasDomain(node: MBeanNode): boolean {
  return node && jmxDomain === node.getProperty('domain')
}

export function hasMBean(node: MBeanNode): boolean {
  return node && node.objectName !== undefined && isObject(node.mbean)
}

export function hasType(node: MBeanNode, type: string): boolean {
  return node && type === node.getType()
}

export function isDomainNode(node: MBeanNode): boolean {
  return node && hasType(node, domainNodeType)
}

export function isContextsFolder(node: MBeanNode): boolean {
  return node && hasDomain(node) && hasType(node, contextsType)
}

export function isContext(node: MBeanNode): boolean {
  return node && hasDomain(node) && hasType(node, contextNodeType)
}

export function findContext(node: MBeanNode): MBeanNode | null {
  if (!node || !hasDomain(node)) return null

  if (isDomainNode(node)) {
    // The camel domain node so traverse to context folder & recurse
    return findContext(node.getIndex(0) as MBeanNode)
  }

  if (isContextsFolder(node)) {
    if (node.childCount() === 0) return null

    // Find first context node in the list
    return node.getIndex(0)
  }

  if (isContext(node)) {
    return node
  }

  // Node is below a context so navigate up the tree
  return node.findAncestor(ancestor => isContext(ancestor))
}

export function isRoutesFolder(node: MBeanNode): boolean {
  return node && hasDomain(node) && !hasMBean(node) && hasType(node, routesType)
}

export function isRouteNode(node: MBeanNode): boolean {
  return node && hasDomain(node) && hasType(node, routeNodeType)
}

export function isRouteXmlNode(node: MBeanNode): boolean {
  return node && hasDomain(node) && hasType(node, routeXmlNodeType)
}

export function isEndpointsFolder(node: MBeanNode): boolean {
  return node && hasDomain(node) && !hasMBean(node) && hasType(node, endpointsType)
}

export function isEndpointNode(node: MBeanNode): boolean {
  return node && hasDomain(node) && hasType(node, endpointNodeType)
}

export function isComponentsFolder(node: MBeanNode): boolean {
  return node && hasDomain(node) && !hasMBean(node) && hasType(node, componentsType)
}

export function isComponentNode(node: MBeanNode): boolean {
  return node && hasDomain(node) && hasType(node, componentNodeType)
}

function findMBean(node: MBeanNode, folder: string, id: string): MBeanNode | null {
  if (!node) return null

  const ctxNode = findContext(node)
  if (!ctxNode) return null

  const result = ctxNode.navigate(mbeansType, folder)
  if (!result || !result.children) return null

  const service = result.getChildren().find(m => m.name.startsWith(id))
  return !service ? null : service
}

export function hasInflightRepository(node: MBeanNode): boolean {
  return findMBean(node, 'services', 'DefaultInflightRepository') !== null
}

export function canViewRouteDiagram(node: MBeanNode): boolean {
  return isRouteNode(node) || isRoutesFolder(node)
}

export function canViewSource(node: MBeanNode): boolean {
  if (isEndpointNode(node) || isEndpointsFolder(node)) return false
  if (!isRouteNode(node) && !isRoutesFolder(node)) return false

  const context = findContext(node)
  return context?.hasInvokeRights(ROUTE_OPERATIONS.dumpRoutesAsXml) ?? false
}

export function canSendMessage(node: MBeanNode): boolean {
  if (!isEndpointNode(node)) return false

  const context = findContext(node)
  return context?.hasInvokeRights(ENDPOINT_OPERATIONS.sendBodyAndHeaders, ENDPOINT_OPERATIONS.sendStringBody) ?? false
}

export function canBrowseMessages(node: MBeanNode): boolean {
  if (!isEndpointNode(node)) return false
  if (!node.hasOperations('browseMessageAsXml')) return false

  return node.hasInvokeRights(ENDPOINT_OPERATIONS.browseAllMessagesAsXml, ENDPOINT_OPERATIONS.browseRangeMessagesAsXml)
}

export function canViewEndpointStats(node: MBeanNode): boolean {
  const registry = getDefaultRuntimeEndpointRegistry(node)
  const canInvoke = registry?.hasInvokeRights('endpointStatistics') ?? false
  return (
    !isEndpointsFolder(node) &&
    !isEndpointNode(node) &&
    !isComponentsFolder(node) &&
    !isComponentNode(node) &&
    (isContext(node) || isRoutesFolder(node)) &&
    canInvoke
  )
}

export function getDefaultRuntimeEndpointRegistry(node: MBeanNode): MBeanNode | null {
  return findMBean(node, 'services', 'DefaultRuntimeEndpointRegistry')
}

export function hasExchange(node: MBeanNode): boolean {
  return (
    node &&
    !isEndpointsFolder(node) &&
    !isEndpointNode(node) &&
    !isComponentsFolder(node) &&
    !isComponentNode(node) &&
    (isContext(node) || isRoutesFolder(node) || isRouteNode(node)) &&
    hasInflightRepository(node)
  )
}

export function findTypeConverter(node: MBeanNode): MBeanNode | null {
  return findMBean(node, 'services', 'TypeConverter')
}

export function canListTypeConverters(node: MBeanNode): boolean {
  const tc = findTypeConverter(node)
  return tc?.hasInvokeRights('listTypeConverters') ?? false
}

export function hasTypeConverter(node: MBeanNode): boolean {
  return (
    node &&
    !isRouteNode(node) &&
    !isRouteXmlNode(node) &&
    !isEndpointsFolder(node) &&
    !isEndpointNode(node) &&
    !isComponentsFolder(node) &&
    !isComponentNode(node) &&
    (isContext(node) || isRoutesFolder(node)) &&
    canListTypeConverters(node)
  )
}

export function findTraceBean(node: MBeanNode): MBeanNode | null {
  return findMBean(node, 'tracer', 'BacklogTracer')
}

export function findDebugBean(node: MBeanNode): MBeanNode | null {
  return findMBean(node, 'tracer', 'BacklogDebugger')
}

export function canGetBreakpoints(node: MBeanNode): boolean {
  if (!isRouteNode(node)) return false

  const db = findDebugBean(node)
  return db?.hasInvokeRights('getBreakpoints') ?? false
}

export function canTrace(node: MBeanNode): boolean {
  if (!isRouteNode(node)) return false

  const trace = findTraceBean(node)
  return trace?.hasInvokeRights('dumpAllTracedMessagesAsXml') ?? false
}

export function findRestRegistryBean(node: MBeanNode): MBeanNode | null {
  return findMBean(node, 'services', 'DefaultRestRegistry')
}

export function canListRestServices(node: MBeanNode): boolean {
  const registry = findRestRegistryBean(node)
  return registry?.hasInvokeRights('listRestServices') ?? false
}

export function hasRestServices(node: MBeanNode): boolean {
  if (!isContext(node) && !isRoutesFolder(node)) return false
  if (!canListRestServices(node)) return false

  const registry = findRestRegistryBean(node)
  return registry ? true : false
}

export function hasProperties(node: MBeanNode): boolean {
  return isRouteNode(node) || isRouteXmlNode(node)
}

export function getCamelVersions(): string[] {
  return [camel3.apacheCamelModelVersion, camel4.apacheCamelModelVersion]
}

/**
 * Returns the corresponding version of Camel model based on the Camel version of
 * the given node. Currently, it supports Camel v3 and v4.
 */
export function getCamelModel(node: MBeanNode): CamelModel {
  if (isCamelVersionEQGT(node, 4, 0)) {
    return camel4 as unknown as CamelModel
  }
  return camel3 as unknown as CamelModel
}

/**
 * Fetch the camel version and add it to the tree to avoid making a blocking call
 * elsewhere.
 */
export async function fetchCamelVersion(contextNode: MBeanNode) {
  const version = contextNode.getProperty('version')
  if (!isBlank(version)) {
    // Already retrieved
    return
  }

  if (!contextNode.objectName) {
    log.warn('Camel version not available due to absence of ObjectName in context node:', contextNode)
    return
  }

  const camelVersion = (await jolokiaService.readAttribute(contextNode.objectName, 'CamelVersion')) as string
  contextNode.addProperty('version', camelVersion)
}

export function getCamelVersion(node: MBeanNode): string | null {
  const ctxNode = findContext(node)
  if (!ctxNode) return null

  return ctxNode.getProperty('version')
}

export function compareVersions(version: string, major: number, minor: number): number {
  const arr = version.split('.')

  // parse int or default to 0
  const vmaj = parseInt(arr[0] ?? '0') || 0
  const vmin = parseInt(arr[1] ?? '0') || 0
  if (vmaj < major) return -1
  if (vmaj > major) return 1

  // vmaj == major
  if (vmin < minor) return -1
  if (vmin > minor) return 1

  // major and minor are the same
  return 0
}

/**
 * Is the currently selected Camel version equal or greater than
 *
 * @param major   major version as number
 * @param minor   minor version as number
 */
export function isCamelVersionEQGT(node: MBeanNode, major: number, minor: number) {
  const camelVersion = getCamelVersion(node)
  if (!camelVersion) {
    return false
  }

  return compareVersions(camelVersion, major, minor) >= 0
}
