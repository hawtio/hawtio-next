import { jolokiaService } from '@hawtiosrc/plugins/connect/jolokia-service'
import { MBeanNode } from '@hawtiosrc/plugins/shared/tree'
import { parseXML } from '@hawtiosrc/util/xml'
import React from 'react'
import * as camelService from './camel-service'
import { contextNodeType, log, routeXmlNodeType, xmlNodeLocalName } from './globals'
import * as icons from './icons'
import { schemaService } from './schema-service'

export type Statistics = {
  id: string
  state: string
  exchangesInflight?: string
  exchangesCompleted?: string
  failuresHandled?: string
  redeliveries?: string
  externalRedeliveries?: string
  minProcessingTime?: string
  maxProcessingTime?: string
  deltaProcessingTime?: string
  meanProcessingTime?: string
  startTimestamp?: string
  resetTimestamp?: string
  lastExchangeFailureExchangeId?: string
  lastExchangeFailureTimestamp?: string
  lastExchangeCreatedTimestamp?: string
  firstExchangeFailureExchangeId?: string
  firstExchangeFailureTimestamp?: string
  lastProcessingTime?: string
  exchangesFailed?: string
  totalProcessingTime?: string
  firstExchangeCompletedTimestamp?: string
  firstExchangeCompletedExchangeId?: string
  lastExchangeCompletedTimestamp?: string
  lastExchangeCompletedExchangeId?: string
  selfProcessingTime?: string
  accumulatedProcessingTime?: string
}

export type ProcessorStats = Statistics & {
  index?: string
  sourceLineNumber?: string
}

export type RouteStats = Statistics & {
  sourceLocation: string
  processorStats: ProcessorStats[]
}

export const ROUTE_OPERATIONS = {
  dumpRoutesAsXml: 'dumpRoutesAsXml()',
} as const

// TODO: This service should be named more properly like RoutesXmlService, RouteStatisticsService, etc.
class RoutesService {
  getIcon(nodeSettingsOrXmlNode: Record<string, unknown> | Element, size?: number): React.ReactNode {
    let nodeSettings: Record<string, unknown> | null = null

    if (nodeSettingsOrXmlNode instanceof Element) {
      const nodeName = nodeSettingsOrXmlNode.localName
      if (nodeName) {
        nodeSettings = schemaService.getSchema(nodeName)
      }
    } else {
      nodeSettings = nodeSettingsOrXmlNode
    }

    if (nodeSettings) {
      const nsObj: Record<string, unknown> = nodeSettings as Record<string, unknown>
      const iconName: string = (nsObj['icon'] as string) || 'generic24.png'

      // transform name into icon component name
      let iname = iconName.replace('.png', '') // Remove png file extension
      iname = iname.replace('24', '') // Remove 24 suffix
      iname = iname.replace('-icon', '') // Remove -icon suffix
      iname = iname.replace('icon', '') // Remove remaining icon suffix
      iname = iname.charAt(0).toUpperCase() + iname.slice(1) // Capitalize
      iname = iname.replace(/-([a-z])/g, s => s[1]?.toUpperCase() ?? s)
      iname = `${iname}Icon`

      //
      // Fetch the correct FunctionComponent icon from the icons module
      //
      return icons.getIcon(iname, size)
    }

    return null
  }

  /**
   * Adds a child to the given folder / route
   * @method
   */
  private loadRouteChild(parent: MBeanNode, routeXml: Element): MBeanNode | null {
    const nodeSettings = schemaService.getSchema(routeXml.localName)

    /*
     * if xml contains an id property then add that to node name
     * if xml contains an uri property then add that to node name
     */
    const xmlId = routeXml.id
    const xmlUri = routeXml.getAttribute('uri')
    const nodeName = (xmlId ? xmlId + ': ' : xmlUri ? xmlUri + ': ' : '') + routeXml.localName

    if (nodeSettings) {
      const node = new MBeanNode(null, nodeName, false)
      node.setType(routeXmlNodeType)
      camelService.setDomain(node)
      const icon: React.ReactNode = this.getIcon(nodeSettings)
      node.setIcons(icon)

      // TODO - tooltips to be implemented
      // updateRouteNodeLabelAndTooltip(node, route, nodeSettings)

      this.loadRouteChildren(node, routeXml)
      return node
    }

    return null
  }

  /**
   * Adds the route children to the given folder for each step in the route
   * @method
   */
  loadRouteChildren(routeNode: MBeanNode, routeXml: Element) {
    routeNode.addProperty('xml', routeXml.outerHTML)
    // Preserve the xml local name for use by views
    routeNode.addProperty(xmlNodeLocalName, routeXml.localName)

    const routeGroup = routeXml.getAttribute('group')
    if (routeGroup) routeNode.addProperty('group', routeGroup)

    for (const childXml of routeXml.children) {
      const child = this.loadRouteChild(routeNode, childXml)
      if (child) routeNode.adopt(child)
    }
  }

  /**
   * Gets routes xml from the context node
   * @param contextNode
   */
  async getRoutesXml(contextNode: MBeanNode | null): Promise<string | null> {
    if (!contextNode) {
      return null
    }

    const mbeanName = contextNode.objectName
    if (!mbeanName) {
      throw new Error('Cannot process route xml as mbean name not available')
    }

    let xml = null
    try {
      xml = await jolokiaService.execute(mbeanName, ROUTE_OPERATIONS.dumpRoutesAsXml)
    } catch (error) {
      throw new Error('Failed to dump xml from mbean: ' + mbeanName)
    }

    if (!xml) {
      throw new Error('Failed to extract any xml from mbean: ' + mbeanName)
    }

    contextNode.addProperty('xml', xml as string)
    return xml as string
  }

  /**
   * Looks up the route XML for the given context and selected route and
   * processes the selected route's XML with the given function
   * @method processRouteXml
   * @param xml
   * @param routeNode the actual route to be examined
   */
  processRouteXml(xml: string, routeNode: MBeanNode | null): Element | null {
    if (!routeNode) {
      throw new Error('Route node not available')
    }

    const doc: XMLDocument = parseXML(xml as string)
    const route = doc.getElementById(routeNode.name)
    if (!route || route?.tagName?.toLowerCase() !== 'route') {
      throw new Error(`No routes in ${routeNode.name} route xml`)
    }
    return route
  }

  async transformXml(contextNode: MBeanNode | null, routesNode: MBeanNode | null) {
    if (!contextNode || !routesNode || routesNode.getType() !== 'routes') {
      return
    }
    // routesNode.addProperty('xml', routeXml.outerHTML)
    const xml = await this.getRoutesXml(contextNode)
    if (!xml) return

    routesNode.addProperty('xml', xml)
    routesNode.getChildren().forEach((routeNode: MBeanNode) => {
      try {
        const xmlNode = this.processRouteXml(xml, routeNode)
        if (!xmlNode) return
        this.loadRouteChildren(routeNode, xmlNode)
      } catch (error) {
        log.error(`Failed to process route xml for ${routeNode.name}: ` + error)
      }
    })
  }

  async dumpRoutesStatsXML(routesNode: MBeanNode): Promise<string | null> {
    let xml = null
    const routeNodeOperation = 'dumpRouteStatsAsXml'
    const routesFolderOperation = 'dumpRoutesStatsAsXml'

    const mbeanName = routesNode.getProperty(contextNodeType)
    const operationForMBean = mbeanName ? routesFolderOperation : routeNodeOperation
    const mbeanToQuery = mbeanName ? mbeanName : routesNode.objectName ?? ''

    try {
      xml = await jolokiaService.execute(mbeanToQuery, operationForMBean, [true, true])
    } catch (error) {
      throw new Error('Failed to dump routes stats from mbean: ' + mbeanName + error)
    }
    if (!xml) {
      throw new Error('Failed to extract any xml from mbean: ' + mbeanName)
    }
    return xml as string
  }

  processRoutesStats(statsXml: string): RouteStats[] {
    const doc: XMLDocument = parseXML(statsXml)
    const routesStats: RouteStats[] = []
    const allRoutes = doc.getElementsByTagName('routeStat')
    for (const route of allRoutes) {
      routesStats.push(this.createRouteStats(route))
    }
    return routesStats
  }

  createProcessorStats(routeid: string, pDoc: Element): ProcessorStats {
    let res: ProcessorStats = {
      id: '',
      index: '',
      state: '',
    }

    for (const atr of pDoc.getAttributeNames()) {
      res = { ...res, [atr]: pDoc.getAttribute(atr) }
    }
    return res as ProcessorStats
  }

  createRouteStats(pDoc: Element): RouteStats {
    const procStats = pDoc.getElementsByTagName('processorStat')
    const processorStats: ProcessorStats[] = []

    for (const pStat of procStats) {
      processorStats.push(this.createProcessorStats(pDoc.id, pStat))
    }
    let routeStats: RouteStats = { id: '', processorStats: processorStats, sourceLocation: '', state: '' }

    for (const atr of pDoc.getAttributeNames()) {
      routeStats = { ...routeStats, [atr]: pDoc.getAttribute(atr) }
    }
    return routeStats
  }
}

export const routesService = new RoutesService()
