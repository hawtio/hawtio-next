import React from 'react'
import { MBeanNode } from '@hawtio/plugins/shared'
import { jolokiaService } from '@hawtio/plugins/connect/jolokia-service'
import { log } from './globals'
import $ from 'jquery'
import { schemaService } from './schema-service'
import { RouteIcon } from './icons'

class RoutesService {

  private getIcon(nodeSettingsOrXmlNode: object|Element): React.ReactNode {
    let nodeSettings: object|null = null;

    if (nodeSettingsOrXmlNode instanceof Element) {
      const nodeName = nodeSettingsOrXmlNode.localName;
      if (nodeName) {
        nodeSettings = schemaService.getSchema(nodeName);
      }
    } else {
      nodeSettings = nodeSettingsOrXmlNode;
    }

    if (nodeSettings) {
      const nsObj: any = nodeSettings as object
      const iconName = nsObj["icon"] || "generic24.png";
      console.log("icon for " + nodeSettingsOrXmlNode + " is " + iconName)
      return React.createElement(RouteIcon)
    }

    return null
  }

  /**
  * Adds a child to the given folder / route
  * @method
  */
  private loadRouteChild(parent: MBeanNode, routeXml: Element): MBeanNode|null {
    const nodeName = routeXml.localName;
    const nodeSettings = schemaService.getSchema(nodeName);
    if (nodeSettings) {
      const id = routeXml.getAttribute('id') || nodeName;
      const node = new MBeanNode(parent.owner, id, nodeName, false)
      node.addProperty('type', 'routeNode')
      const icon: React.ReactNode = this.getIcon(nodeSettings);
      node.setIcons(icon)

      // updateRouteNodeLabelAndTooltip(node, route, nodeSettings);

      this.loadRouteChildren(node, routeXml)
      return node;
    }

    return null
  }

  /**
   * Adds the route children to the given folder for each step in the route
   * @method
   */
  loadRouteChildren(routeNode: MBeanNode, routeXml: Element) {
    routeNode.addProperty('xml', routeXml.outerHTML)

    $(routeXml).children('*').each((idx, xmlNode) => {
      const child = this.loadRouteChild(routeNode, xmlNode)
      if (child) routeNode.adopt(child)
    });
  }

  /**
   * Looks up the route XML for the given context and selected route and
   * processes the selected route's XML with the given function
   * @method processRouteXml
   * @param contextNode the camel parent context
   * @param routeNode the actual route to be examined
   */
  async processRouteXml(contextNode: MBeanNode|null, routeNode: MBeanNode|null): Promise<Element|null> {
    if (! contextNode || !routeNode) {
      return null
    }

    const mbeanName = contextNode.objectName
    if (!mbeanName) {
      throw new Error('Cannot process route xml as mbean name not available');
    }

    let xml = null
    try {
      // Run synchronously as we want the treeview lazy function to fully complete
      xml = await jolokiaService.execute(mbeanName, 'dumpRoutesAsXml()')
    } catch (error) {
      throw new Error("Failed to dump xml from mbean: " + mbeanName)
    }

    if (! xml) {
      throw new Error("Failed to extract any xml from mbean: " + mbeanName)
    }

    const doc: XMLDocument = $.parseXML(xml as string);
    const routes = $(doc).find("route[id='" + routeNode.name + "']");
    if (routes && routes.length > 0) {
      return routes[0];
    } else {
      throw new Error(`No routes in ${routeNode.name} route xml`)
    }
  }

  transformXml(contextNode: MBeanNode|null, routesNode: MBeanNode|null) {
    if (!contextNode || !routesNode || routesNode.getProperty('type') !== 'routes') {
      return
    }

    routesNode.getChildren().forEach((routeNode: MBeanNode) => {
      this.processRouteXml(contextNode, routeNode)
        .then((routeXml) => {
          if (! routeXml) return
          console.log(routeXml)
          this.loadRouteChildren(routeNode, routeXml)
        })
        .catch((error) => {
          log.error(`Failed to process route xml for ${routeNode.name}: ` + error)
          console.error
        })
    })
  }
}

export const routesService = new RoutesService()
