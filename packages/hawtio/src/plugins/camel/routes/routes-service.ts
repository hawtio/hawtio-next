import { jolokiaService } from '@hawtiosrc/plugins/shared/jolokia-service'
import { MBeanNode } from '@hawtiosrc/plugins/shared/tree'
import { isRouteNode, isRoutesFolder } from '../camel-service'
import { routeGroupsType, routeNodeType } from '../globals'
import { CamelRoute } from './route'

export const ROUTE_OPERATIONS = {
  start: 'start()',
  stop: 'stop()',
  remove: 'remove()',
  isUpdateEnabled: 'isUpdateRouteEnabled()',
  updateRoute: 'updateRouteFromXml',
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
      if (child.getType() === routeNodeType) {
        // read attributes of route
        const camelRoute = await this.readRouteAttributes(child)
        if (camelRoute) routes.push(camelRoute)
      } else if (child.getType() === routeGroupsType) {
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

  private canInvoke(node: MBeanNode, op: string): boolean {
    if (!isRouteNode(node) && !isRoutesFolder(node)) return false

    const target = isRoutesFolder(node) ? node.children?.[0] : node
    return target?.hasInvokeRights(op) ?? false
  }

  canStartRoute(node: MBeanNode): boolean {
    return this.canInvoke(node, ROUTE_OPERATIONS.start)
  }

  async startRoute(node: MBeanNode) {
    const { objectName } = node
    if (!objectName) return

    await jolokiaService.execute(objectName, ROUTE_OPERATIONS.start)
  }

  canStopRoute(node: MBeanNode): boolean {
    return this.canInvoke(node, ROUTE_OPERATIONS.stop)
  }

  async stopRoute(node: MBeanNode) {
    const { objectName } = node
    if (!objectName) return

    await jolokiaService.execute(objectName, ROUTE_OPERATIONS.stop)
  }

  canDeleteRoute(node: MBeanNode): boolean {
    return node.hasInvokeRights(ROUTE_OPERATIONS.remove)
  }

  async isRouteUpdateEnabled(node: MBeanNode): Promise<boolean> {
    const { objectName } = node
    if (!objectName) return false

    return (await jolokiaService.execute(objectName, ROUTE_OPERATIONS.isUpdateEnabled)) as boolean
  }

  async deleteRoute(node: MBeanNode) {
    const { objectName } = node
    if (!objectName) return

    await jolokiaService.execute(objectName, ROUTE_OPERATIONS.remove)
  }

  saveRoute(node: MBeanNode, code: string) {
    const { objectName } = node
    if (!objectName) return

    jolokiaService.execute(objectName, ROUTE_OPERATIONS.updateRoute, [code])
  }
}

export const routesService = new RoutesService()
