import { MBeanNode, jolokiaService } from '@hawtiosrc/plugins/shared'
import { isBlank } from '@hawtiosrc/util/strings'
import { childText, xmlText } from '@hawtiosrc/util/xml'
import { IRequest, IResponseFn } from 'jolokia.js'
import { camelPreferencesService } from '../camel-preferences-service'
import * as camelService from '../camel-service'
import { log } from '../globals'

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
    const db = camelService.findDebugBean(node)
    if (!db || !db.objectName) camelService.notifyError('Could not find the debug bean')

    return db
  }

  async isDebugging(node: MBeanNode): Promise<boolean> {
    const db = this.getDebugBean(node)
    if (!db || !db.objectName) return false

    const result = await jolokiaService.readAttribute(db.objectName, 'Enabled')
    if (!result) return false

    return result as boolean
  }

  async setDebugging(node: MBeanNode, flag: boolean): Promise<boolean> {
    const db = this.getDebugBean(node)
    if (!db || !db.objectName) return false

    const options = camelPreferencesService.loadCamelPreferences()
    await jolokiaService.writeAttribute(db.objectName, 'BodyMaxChars', options.maximumTraceDebugBodyLength)
    await jolokiaService.writeAttribute(db.objectName, 'BodyIncludeStreams', options.isIncludeTraceDebugStreams)
    await jolokiaService.writeAttribute(db.objectName, 'BodyIncludeFiles', options.isIncludeTraceDebugStreams)

    const method = flag ? 'enableDebugger' : 'disableDebugger'
    await jolokiaService.execute(db.objectName, method)
    return await this.isDebugging(node)
  }

  async getBreakpoints(node: MBeanNode): Promise<string[]> {
    const db = this.getDebugBean(node)
    if (!db || !db.objectName) return []

    const result = await jolokiaService.execute(db.objectName, 'getBreakpoints')
    return result as string[]
  }

  async addBreakpoint(node: MBeanNode, breakpointId: string): Promise<boolean> {
    const db = this.getDebugBean(node)
    if (!db || !db.objectName) return false

    await jolokiaService.execute(db.objectName, 'addBreakpoint', [breakpointId])
    const breakpoints = await this.getBreakpoints(node)
    const added = breakpoints.includes(breakpointId)
    if (added) camelService.notifyInfo('breakpoint created')
    else camelService.notifyError('breakpoint could not be added')

    return added
  }

  async removeBreakpoint(node: MBeanNode, breakpointId: string): Promise<boolean> {
    const db = this.getDebugBean(node)
    if (!db || !db.objectName) return false

    await jolokiaService.execute(db.objectName, 'removeBreakpoint', [breakpointId])
    const breakpoints = await this.getBreakpoints(node)
    const removed = !breakpoints.includes(breakpointId)
    if (removed) camelService.notifyInfo('breakpoint removed')
    else camelService.notifyError('breakpoint could not be removed')

    return removed
  }

  async validateConditionalBreakpoint(node: MBeanNode, breakpoint: ConditionalBreakpoint): Promise<string | null> {
    const db = this.getDebugBean(node)
    if (!db || !db.objectName) return 'Error: cannot find debugger bean'

    const result = await jolokiaService.execute(db.objectName, 'validateConditionalBreakpoint', [
      breakpoint.language,
      breakpoint.predicate,
    ])

    return result as string | null
  }

  async addConditionalBreakpoint(node: MBeanNode, conditionalBreakpoint: ConditionalBreakpoint): Promise<boolean> {
    log.info('Add conditional breakpoint')
    const db = this.getDebugBean(node)
    if (!db || !db.objectName) return false

    await jolokiaService.execute(db.objectName, 'addConditionalBreakpoint', [
      conditionalBreakpoint.nodeId,
      conditionalBreakpoint.language,
      conditionalBreakpoint.predicate,
    ])

    const breakpoints = await this.getBreakpoints(node)
    const added = breakpoints.includes(conditionalBreakpoint.nodeId)
    if (added) camelService.notifyInfo('conditional breakpoint created')
    else camelService.notifyError('conditional breakpoint could not be added')

    return added
  }

  /*
   * Return the current node id we are stopped at
   */
  async getSuspendedBreakpointIds(node: MBeanNode): Promise<string[]> {
    const db = this.getDebugBean(node)
    if (!db || !db.objectName) return []

    const result = await jolokiaService.execute(db.objectName, 'getSuspendedBreakpointNodeIds')
    return result as string[]
  }

  async stepBreakpoint(node: MBeanNode, breakpointId: string): Promise<string[]> {
    const db = this.getDebugBean(node)
    if (!db || !db.objectName) return []

    await jolokiaService.execute(db.objectName, 'stepBreakpoint(java.lang.String)', [breakpointId])

    // Return the new suspended breakpoint
    return await this.getSuspendedBreakpointIds(node)
  }

  async getBreakpointCounter(node: MBeanNode): Promise<number> {
    const db = this.getDebugBean(node)
    if (!db || !db.objectName) return 0

    const result = await jolokiaService.execute(db.objectName, 'getDebugCounter')
    return result as number
  }

  async getTracedMessages(node: MBeanNode, breakpointId: string): Promise<string> {
    const db = this.getDebugBean(node)
    if (!db || !db.objectName) return ''

    const result = await jolokiaService.execute(db.objectName, 'dumpTracedMessagesAsXml(java.lang.String)', [
      breakpointId,
    ])
    return result as string
  }

  async resume(node: MBeanNode): Promise<void> {
    const db = this.getDebugBean(node)
    if (!db || !db.objectName) return

    await jolokiaService.execute(db.objectName, 'resumeAll')
  }

  private humanizeJavaType(type: string | null): string {
    if (!type) return ''

    // skip leading java.lang
    if (type.startsWith('java.lang')) {
      return type.substring(10)
    }

    return type
  }

  createMessageFromXml(exchange: Element): MessageData | null {
    const uid = childText(exchange, 'uid') || ''
    const timestamp = childText(exchange, 'timestamp') || ''

    let message = exchange.querySelector('message')
    if (!message) {
      message = exchange
    }

    const headerElements = message.querySelectorAll('headers header')
    const headers: Record<string, string> = {}
    const headerTypes: Record<string, string> = {}
    let headerHtml = ''
    headerElements.forEach(headerElement => {
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
          this.humanizeJavaType(typeName) +
          '</td>' +
          "<td class='property-value'>" +
          (value || '') +
          '</td></tr>'
      }
    })

    const id = this.getIdFromHeaders(headers)

    const bodyElement = message.querySelector('body')
    let body = ''
    let bodyType: string | null = ''
    if (bodyElement) {
      body = bodyElement.textContent || ''
      bodyType = bodyElement.getAttribute('type')
      bodyType = this.humanizeJavaType(bodyType)
    }

    return { headers, headerTypes, id, uid, timestamp, headerHtml, body, bodyType }
  }

  private getIdFromHeaders(headers: Record<string, string>): string {
    if (headers['breadcrumbId']) {
      return headers['breadcrumbId']
    }

    const suffixes = ['MessageID', 'ID', 'Path', 'Name']
    const id = Object.entries(headers)
      .filter(([_, key]) => suffixes.some(suffix => key.endsWith(suffix)))
      .find(([value, _]) => !isBlank(value))?.[0]
    if (id !== undefined) {
      return id
    }

    // lets find the first header with a name or Path in it
    // if still no value, lets use the first :)
    return Object.values(headers).find(v => !isBlank(v)) ?? ''
  }
}

export const debugService = new DebugService()
