import { MBeanNode, jolokiaService } from '@hawtiosrc/plugins/shared'
import { Request, Response } from 'jolokia.js'
import { camelPreferencesService } from '../camel-preferences-service'
import * as camelService from '../camel-service'
import { log } from '../globals'

class TracingService {
  private handles: number[] = []

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

  getTracingBean(node: MBeanNode) {
    const db = camelService.findTraceBean(node) as MBeanNode
    if (!db || !db.objectName) camelService.notifyError('Could not find the tracing bean')

    return db
  }

  async isTracing(node: MBeanNode): Promise<boolean> {
    const tb = this.getTracingBean(node)
    if (!tb) return false

    const result = await jolokiaService.readAttribute(tb.objectName as string, 'Enabled')
    if (!result) return false

    return result as boolean
  }

  async setTracing(node: MBeanNode, flag: boolean): Promise<boolean> {
    const tb = this.getTracingBean(node)
    if (!tb) return false

    const options = camelPreferencesService.loadOptions()
    await jolokiaService.writeAttribute(tb.objectName as string, 'BodyMaxChars', options.maximumTraceOrDebugBodyLength)
    await jolokiaService.writeAttribute(
      tb.objectName as string,
      'BodyIncludeStreams',
      options.traceOrDebugIncludeStreams,
    )
    await jolokiaService.writeAttribute(tb.objectName as string, 'BodyIncludeFiles', options.traceOrDebugIncludeStreams)

    await jolokiaService.execute(tb.objectName as string, 'setEnabled', [flag])

    return await this.isTracing(node)
  }

  async getTracedMessages(node: MBeanNode): Promise<string> {
    const tb = this.getTracingBean(node)
    if (!tb) return ''

    const result = await jolokiaService.execute(tb.objectName as string, 'dumpAllTracedMessagesAsXml()')
    return result as string
  }
}

export const tracingService = new TracingService()
