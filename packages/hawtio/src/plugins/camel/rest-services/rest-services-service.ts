import { MBeanNode, jolokiaService } from '@hawtiosrc/plugins/shared'
import { isObject } from '@hawtiosrc/util/objects'
import { IRequest, IResponseFn } from 'jolokia.js'
import * as camelService from '../camel-service'
import { log } from '../globals'

export interface RestService {
  url: string
  method: string
  consumes: string
  produces: string
  routeId: string
}

class RestServicesService {
  private handles: number[] = []

  async register(request: IRequest, callback: IResponseFn) {
    const handle = await jolokiaService.register(request, callback)
    log.debug('Register handle:', handle)
    this.handles.push(handle)
  }

  unregisterAll() {
    log.debug('Unregister all handles:', this.handles)
    this.handles.forEach(handle => jolokiaService.unregister(handle))
    this.handles = []
  }

  async getRestServices(node: MBeanNode): Promise<RestService[]> {
    if (!node) return []

    const registry = camelService.findRestRegistryBean(node)
    if (!registry || !registry.objectName) return []

    const obj = await jolokiaService.execute(registry.objectName, 'listRestServices()')
    if (!obj || !isObject(obj)) return []

    const restServices: RestService[] = []

    //
    // the JMX tabular data has 2 indexes so
    // need to dive 2 levels down to extract the data
    //
    for (const [, svc] of Object.entries(obj)) {
      if (!svc || !isObject(svc)) continue
      for (const [, svcType] of Object.entries(svc)) {
        if (!svcType || !isObject(svcType)) continue
        restServices.push(svcType as RestService)
      }
    }

    return restServices
  }
}

export const restServicesService = new RestServicesService()
