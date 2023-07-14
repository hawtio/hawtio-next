import { jolokiaService } from '@hawtiosrc/plugins/shared/jolokia-service'
import { MBeanNode } from '@hawtiosrc/plugins/shared/tree'
import * as camelService from '../camel-service'
import { routeGroupsType, routeNodeType } from '../globals'
import { CamelRoute } from './route'

export const ROUTE_OPERATIONS = {
  start: 'start()',
  stop: 'stop()',
  remove: 'remove()',
} as const

interface IRoutesService {
  getRoutesAttributes(routeFolder: MBeanNode | null): Promise<CamelRoute[]>
  canStartRoute(node: MBeanNode): boolean
  startRoute(node: MBeanNode): Promise<void>
  canStopRoute(node: MBeanNode): boolean
  stopRoute(node: MBeanNode): Promise<void>
  canDeleteRoute(node: MBeanNode): boolean
  deleteRoute(node: MBeanNode): Promise<void>
}

class RoutesService implements IRoutesService {
  async getRoutesAttributes(routesFolder: MBeanNode): Promise<CamelRoute[]> {
    const children = routesFolder.getChildren()
    if (children.length === 0) return []

    /*
     * If the children are route groups then it recurses
     * to return the contents of the groups
     */
    const routes: CamelRoute[] = []
    for (const child of children) {
      if (camelService.hasType(child, routeNodeType)) {
        // read attributes of route
        const camelRoute = await this.readRouteAttributes(child)
        if (camelRoute) routes.push(camelRoute)
      } else if (camelService.hasType(child, routeGroupsType)) {
        // recurse into route group
        const camelRoutes = await this.getRoutesAttributes(child)
        routes.push(...camelRoutes)
      }
    }

    return routes
  }

  private async readRouteAttributes(routeNode: MBeanNode): Promise<CamelRoute | null> {
    const { objectName } = routeNode
    if (!objectName) return null

    const attributes = await jolokiaService.readAttributes(objectName)
    return new CamelRoute(
      routeNode,
      attributes['RouteId'] as string,
      attributes['State'] as string,
      attributes['Uptime'] as string,
      attributes['ExchangesCompleted'] as number,
      attributes['ExchangesFailed'] as number,
      attributes['FailuresHandled'] as number,
      attributes['ExchangesTotal'] as number,
      attributes['ExchangesInflight'] as number,
      attributes['MeanProcessingTime'] as number,
    )
  }

  canStartRoute(node: MBeanNode): boolean {
    return node.hasInvokeRights(ROUTE_OPERATIONS.start)
  }

  async startRoute(node: MBeanNode) {
    const { objectName } = node
    if (!objectName) return

    await jolokiaService.execute(objectName, ROUTE_OPERATIONS.start)
  }

  canStopRoute(node: MBeanNode): boolean {
    return node.hasInvokeRights(ROUTE_OPERATIONS.stop)
  }

  async stopRoute(node: MBeanNode) {
    const { objectName } = node
    if (!objectName) return

    await jolokiaService.execute(objectName, ROUTE_OPERATIONS.stop)
  }

  canDeleteRoute(node: MBeanNode): boolean {
    return node.hasInvokeRights(ROUTE_OPERATIONS.remove)
  }

  async deleteRoute(node: MBeanNode) {
    const { objectName } = node
    if (!objectName) return

    await jolokiaService.execute(objectName, ROUTE_OPERATIONS.remove)
  }
}

export const routesService = new RoutesService()
