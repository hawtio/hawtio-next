import { log } from '../globals'
import { IRequest, IResponseFn } from 'jolokia.js'
import { jolokiaService, AttributeValues } from '@hawtiosrc/plugins/connect/jolokia-service'
import { MBeanNode } from '@hawtiosrc/plugins/shared'

export interface ContextDashAttributes {
  context: string,
  mbean: string,
  state: string
}

class ContextsService {
  private handles: number[] = []

  createContextAttibutes(context: string, mbean: string, attributes: AttributeValues): ContextDashAttributes {
    const actx: ContextDashAttributes = {
      context: context,
      mbean: mbean,
      state: attributes ? attributes['State'] as string : 'Not Found'
    }

    return actx
  }

  async getContexts(ctxsNode: MBeanNode | null): Promise<ContextDashAttributes[]> {
    if (!ctxsNode) return []

    const children = ctxsNode.getChildren()
    if (children.length == 0)
      return []

    const ctxAttributes: ContextDashAttributes[] = []
    for (const child of children) {
      if (! child.objectName)
        continue

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

  startContext(context: ContextDashAttributes): Promise<any> {
    return this.executeOperationOnContext('start()', context);
  }

  suspendContext(context: ContextDashAttributes): Promise<any> {
    return this.executeOperationOnContext('suspend()', context);
  }

  stopContext(context: ContextDashAttributes): Promise<any> {
    return this.executeOperationOnContext('stop()', context);
  }

  executeOperationOnContext(operation: string, context: ContextDashAttributes): Promise<any> {
    return jolokiaService.execute(context.mbean, operation);
  }
  //
  //   executeOperationOnContexts(operation: string, contexts: Context[]): ng.IPromise<any[]> {
  //     const objectNames = contexts.map(context => context.mbeanName);
  //     return this.jolokiaService.executeMany(objectNames, operation);
  //   }
  // }
}

export const contextsService = new ContextsService()
