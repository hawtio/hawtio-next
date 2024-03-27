import { AttributeValues, jolokiaService } from '@hawtiosrc/plugins/shared/jolokia-service'
import { escapeMBean } from '@hawtiosrc/util/jolokia'
import { Request, Response } from 'jolokia.js'
import { log } from '../globals'
import { rbacService } from '@hawtiosrc/plugins/rbac/rbac-service'
import { eventService } from '@hawtiosrc/core'

class AttributeService {
  private handles: number[] = []

  async read(mbean: string): Promise<AttributeValues> {
    return await jolokiaService.readAttributes(mbean)
  }

  async readWithCallback(mbean: string, callback: (attrs: AttributeValues) => void): Promise<void> {
    const attrs = await jolokiaService.readAttributes(mbean)
    callback(attrs)
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
    const jolokiaUrl = await jolokiaService.getFullJolokiaUrl()
    return `${jolokiaUrl}/read/${escapeMBean(mbean)}/${attribute}`
  }

  async canInvoke(mbean: string, attribute: string, type: string): Promise<boolean> {
    const aclMBean = await rbacService.getACLMBean()
    if (!aclMBean) {
      // Always allow invocation when client-side RBAC is not available
      return true
    }

    const operation = 'canInvoke(java.lang.String,java.lang.String,[Ljava.lang.String;)'
    const args = [mbean, `set${attribute}`, [type]]
    return jolokiaService.execute(aclMBean, operation, args) as Promise<boolean>
  }

  async update(mbeanName: string, attribute: string, value: unknown) {
    await jolokiaService.writeAttribute(mbeanName, attribute, value)
    eventService.notify({ type: 'success', message: `Updated attribute: ${attribute}` })
  }

  async bulkRequest(requests: Request[]) {
    return jolokiaService.bulkRequest(requests)
  }
}

export const attributeService = new AttributeService()
