import { MBeanNode } from '@hawtiosrc/plugins/shared'
import { AttributeValues, jolokiaService } from '@hawtiosrc/plugins/shared/jolokia-service'
import { IRequest, IResponseFn } from 'jolokia.js'
import { log } from '../globals'

export const CONTEXT_STATE_STARTED = 'Started'
export const CONTEXT_STATE_SUSPENDED = 'Suspended'

export const CONTEXT_OPERATIONS = {
  start: 'start()',
  suspend: 'suspend()',
  stop: 'stop()',
} as const

export type ContextState = {
  node: MBeanNode
  state: string
}

class ContextsService {
  private handles: number[] = []

  toContextState(node: MBeanNode, attributes: AttributeValues): ContextState {
    const state = (attributes?.['State'] as string) ?? 'Not Found'
    return { node, state }
  }

  async getContext(contextNode: MBeanNode): Promise<ContextState | null> {
    if (!contextNode.objectName) return null

    const attributes = await jolokiaService.readAttributes(contextNode.objectName)
    return this.toContextState(contextNode, attributes)
  }

  async getContexts(contextsNode: MBeanNode): Promise<ContextState[]> {
    const contextNodes = contextsNode.getChildren()
    if (contextNodes.length === 0) return []

    const ctxAttributes: ContextState[] = []
    for (const contextNode of contextNodes) {
      if (!contextNode.objectName) {
        continue
      }

      const attributes: AttributeValues = await jolokiaService.readAttributes(contextNode.objectName)
      ctxAttributes.push(this.toContextState(contextNode, attributes))
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
    await this.executeOperation(CONTEXT_OPERATIONS.start, context)
  }

  async suspendContext(context: ContextState) {
    await this.executeOperation(CONTEXT_OPERATIONS.suspend, context)
  }

  async stopContext(context: ContextState) {
    await this.executeOperation(CONTEXT_OPERATIONS.stop, context)
  }

  private executeOperation(operation: string, context: ContextState): Promise<unknown> {
    const { objectName } = context.node
    if (!objectName) {
      throw new Error('ObjectName for the context must be provided')
    }
    return jolokiaService.execute(objectName, operation)
  }
}

export const contextsService = new ContextsService()
