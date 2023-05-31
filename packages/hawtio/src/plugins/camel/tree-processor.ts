import { MBeanNode, MBeanTree, TreeProcessor } from '@hawtiosrc/plugins/shared/tree'
import React from 'react'
import * as ccs from './camel-content-service'
import {
  camelContexts,
  componentNodeType,
  componentsType,
  contextNodeType,
  contextsType,
  dataformatsType,
  defaultRouteGroupsType,
  domainNodeType,
  endpointNodeType,
  endpointsType,
  jmxDomain,
  mbeansType,
  routeGroupsType,
  routeNodeType,
  routesType,
} from './globals'
import { IconNames, getIcon } from './icons'
import { routesService } from './routes-service'

function adoptChild(parent: MBeanNode | null, child: MBeanNode | null, type: string, childIcon: React.ReactNode) {
  if (!parent || !child) return

  parent.adopt(child)
  child.setIcons(childIcon)
  if (ccs.isContext(parent)) {
    child.addProperty(contextNodeType, parent.objectName ?? '')
  }
  child.setType(type)
  ccs.setDomain(child)
}

function setChildIcon(node: MBeanNode | null, childIcon: React.ReactNode) {
  if (!node) return

  node.getChildren().forEach(child => {
    child.setIcons(childIcon)
  })
}

function groupRoutes(routesNode: MBeanNode | null) {
  if (!routesNode) return // Nothing to do

  let haveGroups = false
  for (const routeNode of routesNode.getChildren()) {
    const groupId = routeNode.getProperty('group')
    if (groupId) {
      haveGroups = true
      break
    }
  }

  if (!haveGroups) return // Nothing to do - leave routes as not being grouped

  const routeIcon = getIcon(IconNames.CamelRouteIcon)
  const routeNodes = [...routesNode.getChildren()]

  for (const routeNode of routeNodes) {
    if (routeNode.getType() === routeGroupsType) continue

    const groupId = routeNode.getProperty('group')
    let groupNode: MBeanNode
    if (groupId) {
      groupNode = routesNode.getOrCreate(groupId, true)
    } else {
      groupNode = routesNode.getOrCreate(defaultRouteGroupsType, true)
    }

    groupNode.setType(routeGroupsType)
    ccs.setDomain(groupNode)

    adoptChild(groupNode, routeNode, routeNodeType, routeIcon)
  }

  setChildIcon(routesNode, routeIcon)
}

export const camelTreeProcessor: TreeProcessor = async (tree: MBeanTree) => {
  const camelDomain = tree.get(jmxDomain)
  if (!camelDomain) {
    return
  }

  camelDomain.setIcons(getIcon(IconNames.CamelIcon))
  camelDomain.setType(domainNodeType)
  ccs.setDomain(camelDomain)

  // Detach current children from domain node
  const oldContexts = camelDomain.removeChildren()

  // Create the initial contexts group node
  const groupCtxsNode = camelDomain.getOrCreate(camelContexts, true)
  groupCtxsNode.setIcons(getIcon(IconNames.CamelIcon))
  groupCtxsNode.addProperty('class', 'org-apache-camel-context-folder')
  groupCtxsNode.addProperty('key', camelContexts)
  groupCtxsNode.addProperty('name', camelContexts)
  groupCtxsNode.setType(contextsType)
  ccs.setDomain(groupCtxsNode)

  for (const context of oldContexts) {
    const contextCategory = context.get(contextNodeType)
    let newCtxNode: MBeanNode | null = null
    if (contextCategory && contextCategory.childCount() === 1) {
      newCtxNode = contextCategory.getIndex(0)
    }

    if (!newCtxNode) return

    newCtxNode.setType(contextNodeType)
    ccs.setDomain(newCtxNode)
    // Set the camel version as a property on the context
    ccs.setCamelVersion(newCtxNode)
    newCtxNode.setIcons(getIcon(IconNames.CamelIcon))

    const endPointFolderIcon = getIcon(IconNames.EndpointsFolderIcon)
    const endPointIcon = getIcon(IconNames.EndpointsNodeIcon)
    const routeIcon = getIcon(IconNames.CamelRouteIcon)

    const routesNode = context.get(routesType)
    adoptChild(newCtxNode, routesNode, routesType, endPointFolderIcon)
    setChildIcon(routesNode, routeIcon)
    ccs.setChildProperties(routesNode, routeNodeType)
    routesNode?.addProperty(contextNodeType, newCtxNode.objectName ?? '')

    await routesService.transformXml(newCtxNode, routesNode)

    // Once XML has been processed then group the routes if they have groupIds
    groupRoutes(routesNode)

    const endpointsNode = context.get(endpointsType)
    adoptChild(newCtxNode, endpointsNode, endpointsType, endPointFolderIcon)
    setChildIcon(endpointsNode, endPointIcon)
    ccs.setChildProperties(endpointsNode, endpointNodeType)

    const componentsNode = context.get(componentsType)
    adoptChild(newCtxNode, componentsNode, componentsType, endPointFolderIcon)
    setChildIcon(componentsNode, endPointIcon)
    ccs.setChildProperties(componentsNode, componentNodeType)

    const dataFormatsNode = context.get(dataformatsType)
    adoptChild(newCtxNode, dataFormatsNode, dataformatsType, endPointFolderIcon)

    //
    // Add all other entries which are not one of
    // context/routes/endpoints/components/dataformats as MBeans
    //
    const mBeansNode = newCtxNode.getOrCreate(mbeansType, true)
    mBeansNode.setType(mbeansType)
    ccs.setDomain(mBeansNode)

    const predefinedTypes = new Set([contextNodeType, routesType, endpointsType, componentsType, dataformatsType])
    context
      .getChildren()
      .filter(child => !predefinedTypes.has(child.name))
      .forEach(child => mBeansNode.adopt(child))

    mBeansNode.sort(false)

    // Finally add the new context to the group of contexts node
    groupCtxsNode.adopt(newCtxNode)
    // Reinitialise HTML ids for the new Camel tree
    groupCtxsNode.initId(true)
  }
}
