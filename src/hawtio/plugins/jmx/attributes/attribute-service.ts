import { AttributeValues, jolokiaService } from '@hawtio/plugins/connect/jolokia-service'
import { escapeMBean } from '@hawtio/util/jolokia'
import { IRequest, IResponseFn } from 'jolokia.js'

class AttributeService {
  constructor() {}

  async read(mbean: string): Promise<AttributeValues> {
    return await jolokiaService.read(mbean)
  }

  async register(request: IRequest, callback: IResponseFn): Promise<number> {
    return await jolokiaService.register(request, callback)
  }

  unregister(handle: number) {
    jolokiaService.unregister(handle)
  }

  async buildUrl(mbean: string, attribute: string): Promise<string> {
    const jolokiaUrl = await jolokiaService.getJolokiaUrl()
    return `${jolokiaUrl}/read/${escapeMBean(mbean)}/${attribute}`
  }
}

export const attributeService = new AttributeService()
