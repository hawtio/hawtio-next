import { AttributeValues, jolokiaService } from '@hawtiosrc/plugins/shared/jolokia-service'
import { escapeMBean } from '@hawtiosrc/util/jolokia'
import { Request, Response } from 'jolokia.js'
import { log } from '../globals'

class AttributeService {
  private handles: number[] = []

  async read(mbean: string): Promise<AttributeValues> {
    return await jolokiaService.readAttributes(mbean)
  }

  async register(request: Request, callback: (response: Response) => void) {
    const handle = await jolokiaService.register(request, callback)
    log.debug('Register handle:', handle)
    this.handles.push(handle)
  }

  unregisterAll() {
    log.debug('Unregister all handles:', this.handles)
    this.handles.forEach(handle => jolokiaService.unregister(handle))
    this.handles = []
  }

  async buildUrl(mbean: string, attribute: string): Promise<string> {
    const jolokiaUrl = await jolokiaService.getJolokiaUrl()
    return `${jolokiaUrl}/read/${escapeMBean(mbean)}/${attribute}`
  }
}

export const attributeService = new AttributeService()
