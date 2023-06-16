import { AttributeValues, jolokiaService } from '@hawtiosrc/plugins/connect/jolokia-service'
import { MBeanNode } from '@hawtiosrc/plugins/shared'
import { IRequest, IResponseFn } from 'jolokia.js'
import { log } from '../globals'

export const CONTEXT_STATE_STARTED = 'Started'
export const CONTEXT_STATE_SUSPENDED = 'Suspended'

export type ContextState = {
  context: string
  mbean: string
  state: string
}

class ContextsService {
  private handles: number[] = []

  toContextState(context: string, mbean: string, attributes: AttributeValues): ContextState {
    return {
      context: context,
      mbean: mbean,
      state: (attributes?.['State'] as string) ?? 'Not Found',
    }
  }

  async getContext(contextNode: MBeanNode): Promise<ContextState | null> {
    if (!contextNode.objectName) return null

    const attributes = await jolokiaService.readAttributes(contextNode.objectName)
    return this.toContextState(contextNode.name, contextNode.objectName, attributes)
  }

  async getContexts(contextsNode: MBeanNode): Promise<ContextState[]> {
    const contexts = contextsNode.getChildren()
    if (contexts.length === 0) return []

    const ctxAttributes: ContextState[] = []
    for (const ctx of contexts) {
      if (!ctx.objectName) continue

      const attributes: AttributeValues = await jolokiaService.readAttributes(ctx.objectName)
      ctxAttributes.push(this.toContextState(ctx.name, ctx.objectName, attributes))
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

  async startContext(context: ContextState) {
    await this.executeOperation('start()', context)
  }

  async suspendContext(context: ContextState) {
    await this.executeOperation('suspend()', context)
  }

  async stopContext(context: ContextState) {
    await this.executeOperation('stop()', context)
  }

  private executeOperation(operation: string, context: ContextState): Promise<unknown> {
    return jolokiaService.execute(context.mbean, operation)
  }
}

export const contextsService = new ContextsService()
