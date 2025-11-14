import { eventService } from '@hawtiosrc/core'
import { rbacService } from '@hawtiosrc/plugins/rbac/rbac-service'
import { AttributeValues, jolokiaService } from '@hawtiosrc/plugins/shared/jolokia-service'
import { escapeMBean } from '@hawtiosrc/util/jolokia'
import { JolokiaRequest, JolokiaErrorResponse, JolokiaSuccessResponse, RequestOptions } from 'jolokia.js'
import { log } from '../globals'
import { jmxPreferencesService } from '../jmx-preferences-service'

class AttributeService {
  private handles: number[] = []

  private requestOptions(): RequestOptions {
    const { serializeLong } = jmxPreferencesService.loadOptions()
    return serializeLong ? { serializeLong: 'string' } : {}
  }

  private setupConfig(request: JolokiaRequest): JolokiaRequest {
    const { serializeLong } = jmxPreferencesService.loadOptions()
    if (serializeLong) {
      request.config = { ...request.config, serializeLong: 'string' }
    }
    return request
  }

  async read(mbean: string): Promise<AttributeValues> {
    return await jolokiaService.readAttributes(mbean, this.requestOptions()).catch(e => {
      eventService.notify({ type: 'warning', message: jolokiaService.errorMessage(e) })
      return {} as AttributeValues
    })
  }

  async readWithCallback(mbean: string, callback: (attrs: AttributeValues) => void): Promise<void> {
    const attrs = await jolokiaService.readAttributes(mbean, this.requestOptions()).catch(e => {
      eventService.notify({ type: 'warning', message: jolokiaService.errorMessage(e) })
      return {} as AttributeValues
    })
    callback(attrs)
  }

  async register(request: JolokiaRequest, callback: (response: JolokiaSuccessResponse | JolokiaErrorResponse) => void) {
    const handle = await jolokiaService.register(this.setupConfig(request), callback)
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
    await jolokiaService
      .writeAttribute(mbeanName, attribute, value, this.requestOptions())
      .then(_ => {
        eventService.notify({ type: 'success', message: `Updated attribute: ${attribute}` })
      })
      .catch(e => {
        eventService.notify({ type: 'warning', message: jolokiaService.errorMessage(e) })
      })
  }

  async bulkRequest(requests: JolokiaRequest[]) {
    return jolokiaService.bulkRequest(requests.map(this.setupConfig))
  }
}

export const attributeService = new AttributeService()
