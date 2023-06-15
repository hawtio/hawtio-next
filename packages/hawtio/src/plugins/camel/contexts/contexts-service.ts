import { AttributeValues, jolokiaService } from '@hawtiosrc/plugins/connect/jolokia-service'
import { MBeanNode } from '@hawtiosrc/plugins/shared'
import { IRequest, IResponseFn } from 'jolokia.js'
import { log } from '../globals'

export type ContextAttributes = {
  context: string
  mbean: string
  state: string
}

class ContextsService {
  private handles: number[] = []

  createContextAttributes(context: string, mbean: string, attributes: AttributeValues): ContextAttributes {
    const attrs: ContextAttributes = {
      context: context,
      mbean: mbean,
      state: attributes ? (attributes['State'] as string) : 'Not Found',
    }

    return attrs
  }

  async getContext(ctxNode: MBeanNode | null): Promise<ContextAttributes | null> {
    if (!ctxNode || !ctxNode.objectName) return null

    const attributes = await jolokiaService.readAttributes(ctxNode.objectName)
    return this.createContextAttributes(ctxNode.name, ctxNode.objectName, attributes)
  }

  async getContexts(ctxsNode: MBeanNode | null): Promise<ContextAttributes[]> {
    if (!ctxsNode) return []

    const children = ctxsNode.getChildren()
    if (children.length === 0) return []

    const ctxAttributes: ContextAttributes[] = []
    for (const child of children) {
      if (!child.objectName) continue

      const attributes: AttributeValues = await jolokiaService.readAttributes(child.objectName as string)
      ctxAttributes.push(this.createContextAttributes(child.name, child.objectName, attributes))
    }

    return ctxAttributes
  }

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

  startContext(context: ContextAttributes): Promise<unknown> {
    return this.executeOperationOnContext('start()', context)
  }

  suspendContext(context: ContextAttributes): Promise<unknown> {
    return this.executeOperationOnContext('suspend()', context)
  }

  stopContext(context: ContextAttributes): Promise<unknown> {
    return this.executeOperationOnContext('stop()', context)
  }

  executeOperationOnContext(operation: string, context: ContextAttributes): Promise<unknown> {
    return jolokiaService.execute(context.mbean, operation)
  }
}

export const contextsService = new ContextsService()
