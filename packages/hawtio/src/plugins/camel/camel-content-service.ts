import { MBeanNode } from '@hawtiosrc/plugins/shared'
import { isObject } from '@hawtiosrc/util/objects'
import {
  jmxDomain,
  camelContexts,
  routes,
  routeNode
} from './globals'

export function setType(node: MBeanNode, type: string) {
  node.addProperty('type', type)
}

export function setDomain(node: MBeanNode) {
  node.addProperty('domain', jmxDomain)
}

export function isDomain(node: MBeanNode): boolean {
  return node && jmxDomain === node.getProperty('domain')
}

export function hasMBean(node: MBeanNode): boolean {
  return node && isObject(node.mbean)
}

export function isType(node: MBeanNode, type: string): boolean {
  return node && type === node.getProperty('type')
}

export function isContextsFolder(node: MBeanNode): boolean {
  return node && node.id.startsWith(camelContexts)
}

export function isRoutesFolder(node: MBeanNode): boolean {
  return node && isDomain(node) &&
         !node.objectName && node.id === routes
}

export function isRouteNode(node: MBeanNode): boolean {
  return node && isDomain(node) && isType(node, routeNode)
}
