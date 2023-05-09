import { MBeanNode } from '@hawtiosrc/plugins/shared'
import { log } from '../globals'
import * as ccs from '../camel-content-service'
import { jolokiaService } from '@hawtiosrc/plugins/connect'
import { camelPreferencesService } from '../camel-preferences-service'
import { IRequest, IResponseFn } from 'jolokia.js'
import { childText, xmlText } from '@hawtiosrc/util/xml'

export interface ConditionalBreakpoint {
  nodeId: string
  language: string
  predicate: string
}

export interface MessageData {
  id: string | null
  uid: string
  timestamp: string
  headers: Record<string, string>
  headerTypes: Record<string, string>
  headerHtml: string
  body?: string
  bodyType?: string
  toNode?: string
}

class DebugService {
  private handles: number[] = []

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

  getDebugBean(node: MBeanNode): MBeanNode | null {
    const db = ccs.findDebugBean(node) as MBeanNode
    if (!db || !db.objectName) ccs.notifyError('Could not find the debug bean')

    return db
  }

  async isDebugging(node: MBeanNode): Promise<boolean> {
    const db = this.getDebugBean(node)
    if (!db) return false

    const result = await jolokiaService.readAttribute(db.objectName as string, 'Enabled')
    if (!result) return false

    return result as boolean
  }

  async setDebugging(node: MBeanNode, flag: boolean): Promise<boolean> {
    const db = this.getDebugBean(node)
    if (!db) return false

    const options = camelPreferencesService.loadCamelPreferences()
    await jolokiaService.writeAttribute(db.objectName as string, 'BodyMaxChars', options.maximumTraceDebugBodyLength)
    await jolokiaService.writeAttribute(
      db.objectName as string,
      'BodyIncludeStreams',
      options.isIncludeTraceDebugStreams,
    )
    await jolokiaService.writeAttribute(db.objectName as string, 'BodyIncludeFiles', options.isIncludeTraceDebugStreams)

    const method = flag ? 'enableDebugger' : 'disableDebugger'
    await jolokiaService.execute(db.objectName as string, method)
    return await this.isDebugging(node)
  }

  async getBreakpoints(node: MBeanNode): Promise<string[]> {
    const db = this.getDebugBean(node)
    if (!db) return []

    const result = await jolokiaService.execute(db.objectName as string, 'getBreakpoints')
    return result as string[]
  }

  async addBreakpoint(node: MBeanNode, breakpointId: string): Promise<boolean> {
    const db = this.getDebugBean(node)
    if (!db) return false

    await jolokiaService.execute(db.objectName as string, 'addBreakpoint', [breakpointId])
    const breakpoints = await this.getBreakpoints(node)
    const added = breakpoints.includes(breakpointId)
    if (added) ccs.notifyInfo('breakpoint created')
    else ccs.notifyError('breakpoint could not be added')

    return added
  }

  async removeBreakpoint(node: MBeanNode, breakpointId: string): Promise<boolean> {
    const db = this.getDebugBean(node)
    if (!db) return false

    await jolokiaService.execute(db.objectName as string, 'removeBreakpoint', [breakpointId])
    const breakpoints = await this.getBreakpoints(node)
    const removed = !breakpoints.includes(breakpointId)
    if (removed) ccs.notifyInfo('breakpoint removed')
    else ccs.notifyError('breakpoint could not be removed')

    return removed
  }

  async validateConditionalBreakpoint(node: MBeanNode, breakpoint: ConditionalBreakpoint): Promise<string | null> {
    const db = this.getDebugBean(node)
    if (!db) return 'Error: cannot find debugger bean'

    const result = await jolokiaService.execute(db.objectName as string, 'validateConditionalBreakpoint', [
      breakpoint.language,
      breakpoint.predicate,
    ])

    return result as string | null
  }

  async addConditionalBreakpoint(node: MBeanNode, conditionalBreakpoint: ConditionalBreakpoint): Promise<boolean> {
    log.info('Add conditional breakpoint')
    const db = this.getDebugBean(node)
    if (!db) return false

    await jolokiaService.execute(db.objectName as string, 'addConditionalBreakpoint', [
      conditionalBreakpoint.nodeId,
      conditionalBreakpoint.language,
      conditionalBreakpoint.predicate,
    ])

    const breakpoints = await this.getBreakpoints(node)
    const added = breakpoints.includes(conditionalBreakpoint.nodeId)
    if (added) ccs.notifyInfo('conditional breakpoint created')
    else ccs.notifyError('conditional breakpoint could not be added')

    return added
  }

  /*
   * Return the current node id we are stopped at
   */
  async getSuspendedBreakpointIds(node: MBeanNode): Promise<string[]> {
    const db = this.getDebugBean(node)
    if (!db) return []

    const result = await jolokiaService.execute(db.objectName as string, 'getSuspendedBreakpointNodeIds')
    return result as string[]
  }

  async stepBreakpoint(node: MBeanNode, breakpointId: string): Promise<string[]> {
    const db = this.getDebugBean(node)
    if (!db) return []

    await jolokiaService.execute(db.objectName as string, 'stepBreakpoint(java.lang.String)', [breakpointId])

    // Return the new suspended breakpoint
    return await this.getSuspendedBreakpointIds(node)
  }

  async getBreakpointCounter(node: MBeanNode): Promise<number> {
    const db = this.getDebugBean(node)
    if (!db) return 0

    const result = await jolokiaService.execute(db.objectName as string, 'getDebugCounter')
    return result as number
  }

  async getTracedMessages(node: MBeanNode, breakpointId: string): Promise<string> {
    const db = this.getDebugBean(node)
    if (!db) return ''

    const result = await jolokiaService.execute(db.objectName as string, 'dumpTracedMessagesAsXml(java.lang.String)', [
      breakpointId,
    ])
    return result as string
  }

  async resume(node: MBeanNode): Promise<void> {
    const db = this.getDebugBean(node)
    if (!db) return

    await jolokiaService.execute(db.objectName as string, 'resumeAll')
  }

  private humanizeJavaType(type: string): string {
    if (!type) return ''

    // skip leading java.lang
    if (type.startsWith('java.lang')) {
      return type.substring(10)
    }

    return type
  }

  createMessageFromXml(exchange: Element): MessageData | null {
    const uid = childText(exchange, 'uid')
    const timestamp = childText(exchange, 'timestamp')

    let message = exchange.querySelector('message')
    if (!message) {
      message = exchange
    }

    const headerElements = message.querySelectorAll('headers header')
    const headers: Record<string, string> = {}
    const headerTypes: Record<string, string> = {}
    let headerHtml = ''
    Array.from(headerElements).forEach(headerElement => {
      const key = headerElement.getAttribute('key')
      const typeName = headerElement.getAttribute('type')
      const value = xmlText(headerElement)

      if (key) {
        if (value) headers[key] = value
        if (typeName) headerTypes[key] = typeName

        headerHtml +=
          "<tr><td class='property-name'>" +
          key +
          '</td>' +
          "<td class='property-value'>" +
          this.humanizeJavaType(typeName as string) +
          '</td>' +
          "<td class='property-value'>" +
          (value || '') +
          '</td></tr>'
      }
    })

    let id = headers['breadcrumbId']
    if (!id) {
      const postFixes = ['MessageID', 'ID', 'Path', 'Name']
      for (const postFix of postFixes) {
        if (id) break

        for (const [value, key] of Object.entries(headers)) {
          if (!id && key.endsWith(postFix)) id = value
        }
      }

      // lets find the first header with a name or Path in it
      // if still no value, lets use the first :)
      Object.entries(headers).forEach(([value, key]) => {
        if (!id) id = value
      })
    }

    const bodyElement = message.querySelector('body')
    let bodyText = ''
    let bodyType = ''
    if (bodyElement) {
      bodyText = bodyElement.textContent as string
      bodyType = bodyElement.getAttribute('type') as string
      bodyType = this.humanizeJavaType(bodyType as string)
    }

    const messageData: MessageData = {
      headers: headers,
      headerTypes: headerTypes,
      id: id,
      uid: uid as string,
      timestamp: timestamp as string,
      headerHtml: headerHtml,
      body: bodyText,
      bodyType: bodyType,
    }

    return messageData
  }
}

export const debugService = new DebugService()
