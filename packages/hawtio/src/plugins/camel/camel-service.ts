import { eventService } from '@hawtiosrc/core'
import { jolokiaService } from '@hawtiosrc/plugins/connect/jolokia-service'
import { MBeanNode } from '@hawtiosrc/plugins/shared'
import { isObject } from '@hawtiosrc/util/objects'
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
  mbeansType,
  routeNodeType,
  routeXmlNodeType,
  routesType,
} from './globals'
import { ROUTE_OPERATIONS } from './routes-service'

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

    /* Find first context node in the list */
    return node.getIndex(0)
  }

  if (isContext(node)) {
    return node
  } else {
    /* Node is below a context so navigate up the tree */
    return node.findAncestor((ancestor: MBeanNode) => isContext(ancestor))
  }
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
    isCamelVersionEQGT_2_16(node) &&
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
    isCamelVersionEQGT_2_15(node) &&
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
    isCamelVersionEQGT_2_13(node) &&
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
  if (!isCamelVersionEQGT_2_14(node) && !canListRestServices(node)) return false

  const registry = findRestRegistryBean(node)
  return registry ? true : false
}

export function hasProperties(node: MBeanNode): boolean {
  return isRouteNode(node) || isRouteXmlNode(node)
}

/**
 * Fetch the camel version and add it to the tree to avoid making a blocking call
 * elsewhere.
 */
export async function setCamelVersion(contextNode: MBeanNode | null) {
  if (!contextNode) return

  const v = contextNode.getProperty('version')
  if (v && v.length !== 0)
    /* Already retrieved */
    return

  if (!contextNode.objectName) {
    contextNode.addProperty('version', 'Camel Version not available')
    return
  }

  const camelVersion = await jolokiaService.readAttribute(contextNode.objectName, 'CamelVersion')
  contextNode.addProperty('version', camelVersion as string)
}

export function getCamelVersion(node: MBeanNode | null): string {
  const ctxNode = findContext(node as MBeanNode)
  if (!ctxNode) return ''

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
  if (camelVersion) {
    return compareVersions(camelVersion, major, minor) >= 0
  }

  return false
}

export function isCamelVersionEQGT_2_13(node: MBeanNode) {
  return isCamelVersionEQGT(node, 2, 13)
}
export function isCamelVersionEQGT_2_14(node: MBeanNode) {
  return isCamelVersionEQGT(node, 2, 14)
}
export function isCamelVersionEQGT_2_15(node: MBeanNode) {
  return isCamelVersionEQGT(node, 2, 15)
}
export function isCamelVersionEQGT_2_16(node: MBeanNode) {
  return isCamelVersionEQGT(node, 2, 16)
}
