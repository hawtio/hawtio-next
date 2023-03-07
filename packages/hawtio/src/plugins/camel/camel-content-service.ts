import { MBeanNode } from '@hawtiosrc/plugins/shared'
import { isObject } from '@hawtiosrc/util/objects'
import { jolokiaService } from '@hawtiosrc/plugins/connect/jolokia-service'
import {
  componentNodeType,
  componentsType,
  contextNodeType,
  contextsType,
  domainNodeType,
  endpointNodeType,
  endpointsType,
  jmxDomain,
  routeNodeType,
  routesType,
  routeXmlNodeType,
} from './globals'

export function setChildProperties(parent: MBeanNode | null, childType: string) {
  if (!parent) return

  const type = parent.getProperty('type')

  for (const child of parent.getChildren()) {
    setType(child, type)
    setDomain(child)
    setChildProperties(child, childType)
  }
}

export function setType(node: MBeanNode, type: string) {
  node.addProperty('type', type)
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
  return node && type === node.getProperty('type')
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
  if (!node || !hasDomain(node)) return ''

  if (isDomainNode(node)) {
    // The camel domain node
    const ctxsNode = node.getIndex(0)
    return getCamelVersion(ctxsNode)
  }

  if (isContextsFolder(node)) {
    if (node.childCount() === 0) return ''

    /* Find first context node in the list */
    return getCamelVersion(node.getIndex(0))
  }

  if (isContext(node)) {
    return node.getProperty('version')
  } else {
    /* Node is below a context so navigate up the tree */
    return getCamelVersion(node.findAncestor((ancestor: MBeanNode) => isContext(ancestor)))
  }
}
