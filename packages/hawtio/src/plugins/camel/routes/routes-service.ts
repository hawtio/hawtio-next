import { jolokiaService } from '@hawtiosrc/plugins/connect/jolokia-service'
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
  startRoute(objectName: string): Promise<void>
  stopRoute(objectName: string): Promise<void>
  deleteRoute(objectName: string): Promise<void>
}

class RoutesService implements IRoutesService {
  async getRoutesAttributes(routeFolder: MBeanNode | null): Promise<CamelRoute[]> {
    if (!routeFolder) return []

    const children = routeFolder.getChildren()
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

  private async readRouteAttributes(node: MBeanNode): Promise<CamelRoute | null> {
    const { objectName } = node
    if (!objectName) return null

    const attributes = await jolokiaService.readAttributes(objectName)
    return new CamelRoute(
      objectName,
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

  async startRoute(objectName: string) {
    await jolokiaService.execute(objectName, ROUTE_OPERATIONS.start)
  }

  async stopRoute(objectName: string) {
    await jolokiaService.execute(objectName, ROUTE_OPERATIONS.stop)
  }

  async deleteRoute(objectName: string) {
    await jolokiaService.execute(objectName, ROUTE_OPERATIONS.remove)
  }
}

export const routesService = new RoutesService()
