import { AttributeValues, MBeanNode, jolokiaService } from '@hawtio/react'
import { IRequest, IResponseFn } from 'jolokia.js'
import { log } from '../globals'

export interface ContextAttributes {
  context: string
  mbean: string
  state: string
}

class ContextsService {
  private handles: number[] = []

  createContextAttibutes(context: string, mbean: string, attributes: AttributeValues): ContextAttributes {
    const actx: ContextAttributes = {
      context: context,
      mbean: mbean,
      state: attributes ? (attributes['State'] as string) : 'Not Found',
    }

    return actx
  }

  async getContexts(ctxsNode: MBeanNode | null): Promise<ContextAttributes[]> {
    if (!ctxsNode) return []

    const children = ctxsNode.getChildren()
    if (children.length === 0) return []

    const ctxAttributes: ContextAttributes[] = []
    for (const child of children) {
      if (!child.objectName) continue

      const attributes: AttributeValues = await jolokiaService.readAttributes(child.objectName as string)
      ctxAttributes.push(this.createContextAttibutes(child.name, child.objectName, attributes))
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
