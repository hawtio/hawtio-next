import { log } from '../globals'
import { IRequest, IResponseFn } from 'jolokia.js'
import { jolokiaService, AttributeValues } from '@hawtiosrc/plugins/connect/jolokia-service'
import { MBeanNode } from '@hawtiosrc/plugins/shared'
import { isObject } from '@hawtiosrc/util/objects'

export interface ContextAttributes {
  Context: string,
  [key: string]: string
}

class ContextsService {
  private handles: number[] = []

  createContextAttibutes(context: string, mbean: string, attributes: AttributeValues): ContextAttributes {
    const actx: ContextAttributes = {
      Context: context,
      MBean: mbean
    }

    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'CamelId') continue // Not required as we have Context

      const v = value === null ? '' : value
      actx[key] = isObject(v) ? JSON.stringify(v) : String(v)
    }

    return actx
  }

  async getContexts(ctxsNode: MBeanNode | null): Promise<ContextAttributes[]> {
    if (!ctxsNode) return []

    const children = ctxsNode.getChildren()
    if (children.length === 0)
      return []

    const ctxAttributes: ContextAttributes[] = []
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
}

export const contextsService = new ContextsService()
