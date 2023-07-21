import { eventService, NotificationType } from '@hawtiosrc/core'
import { jolokiaService, MBeanNode, workspace } from '@hawtiosrc/plugins/shared'
import { isBlank } from '@hawtiosrc/util/strings'
import { parseXML } from '@hawtiosrc/util/xml'
import * as camelService from '../camel-service'
import { getDefaultRuntimeEndpointRegistry } from '../camel-service'
import { contextNodeType, endpointsType, log } from '../globals'

export type Endpoint = {
  uri: string
  state: string
  mbean: string
}

export type EndpointStatistics = {
  hits: number
  routeId: string
  static: boolean
  index: number
  dynamic: boolean
  url: string
  direction: string
  [key: string]: string | boolean | number
}

export type MessageData = {
  messageId: string
  body: string
  headers: { key: string; type: string; value: string }[]
}

export const ENDPOINT_OPERATIONS = {
  createEndpoint: 'createEndpoint(java.lang.String)',
  componentNames: 'componentNames()',
  canSendToEndpoint: 'canSendToEndpoint(java.lang.String)',
  sendBodyAndHeaders: 'sendBodyAndHeaders(java.lang.String, java.lang.Object, java.util.Map)',
  sendStringBody: 'sendStringBody(java.lang.String, java.lang.String)',
  browseAllMessagesAsXml: 'browseAllMessagesAsXml(java.lang.Boolean)',
  browseRangeMessagesAsXml: 'browseRangeMessagesAsXml(java.lang.Integer,java.lang.Integer, java.lang.Boolean)',
  endpointStatistics: 'endpointStatistics()',
} as const

export async function getEndpoints(node: MBeanNode): Promise<Endpoint[]> {
  const ctxNode = camelService.findContext(node)
  if (!ctxNode || ctxNode.childCount() === 0) return []

  const endpointsNode = ctxNode.get(endpointsType, true)
  if (!endpointsNode) return []

  const endpoints: Endpoint[] = []
  for (const ep of endpointsNode.getChildren()) {
    if (!ep.objectName) continue
    const attributes = await jolokiaService.readAttributes(ep.objectName)
    endpoints.push({
      uri: attributes.EndpointUri as string,
      state: attributes.State as string,
      mbean: ep.objectName,
    })
  }

  return endpoints
}

export function canCreateEndpoints(node: MBeanNode): boolean {
  const contextNode = camelService.findContext(node)
  if (!contextNode) {
    return false
  }
  return contextNode.hasInvokeRights(ENDPOINT_OPERATIONS.createEndpoint)
}

export async function componentNames(node: MBeanNode): Promise<string[]> {
  const ctxNode = camelService.findContext(node)
  if (!ctxNode || ctxNode.childCount() === 0 || !ctxNode.objectName) return []

  const names = await jolokiaService.execute(ctxNode.objectName, ENDPOINT_OPERATIONS.componentNames)
  return names as string[]
}

function notifyError(msg: string) {
  eventService.notify({
    type: 'danger',
    message: msg,
  })
}

export async function createEndpoint(node: MBeanNode, name: string) {
  const ctxNode = camelService.findContext(node)
  if (!ctxNode) {
    notifyError('Could not find the CamelContext!')
    return
  }

  if (!ctxNode.objectName) {
    notifyError('Could not find the CamelContext MBean!')
    return
  }

  jolokiaService
    .execute(ctxNode.objectName, ENDPOINT_OPERATIONS.createEndpoint, [name])
    .then((value: unknown) => {
      if (value === true) {
        workspace.refreshTree()
        eventService.notify({
          type: 'success',
          message: 'Creating endpoint',
          duration: 3000,
        })
      } else {
        eventService.notify({
          type: 'danger',
          message: 'Invalid URI',
        })
      }
    })
    .catch((error: string) => {
      error = error.replace('org.apache.camel.ResolveEndpointFailedException : ', '')
      eventService.notify({
        type: 'danger',
        message: error,
      })
    })
}

export function createEndpointFromData(
  node: MBeanNode,
  componentName: string,
  endPointPath: string,
  parameters: Record<string, string>,
) {
  if (!componentName) console.error('createEndpointFromData: component name must be defined')

  if (!endPointPath) console.error('createEndpointFromData: endpoint path must be defined')

  log.debug('Have endpoint data ' + JSON.stringify(parameters))

  const uri =
    componentName +
    '://' +
    endPointPath +
    (parameters
      ? '?' +
        Object.entries(parameters)
          .map(entry => entry.join('='))
          .join('&')
      : '')

  log.debug('Creating endpoint for uri: ' + uri)
  createEndpoint(node, uri)
}

export function loadEndpointSchema(node: MBeanNode, componentName: string): camelService.CamelModelSchema | null {
  const ctxNode = camelService.findContext(node)
  if (!ctxNode) {
    eventService.notify({
      type: 'danger',
      message: 'Could not find the CamelContext!',
    })
    return null
  }
  if (isBlank(componentName)) return null

  const camelModel = camelService.getCamelModel(ctxNode)
  return camelModel.components.components[componentName] ?? null
}

export async function doSendMessage(
  mbean: MBeanNode,
  body: string,
  headers: { name: string; value: string }[],
  notify: (type: NotificationType, message: string) => void,
) {
  const messageHeaders: Record<string, string> = {}
  headers.forEach(header => {
    const key = header.name
    if (key && key !== '') {
      messageHeaders[key] = header.value
    }
  })

  const context = mbean.parent?.getProperty(contextNodeType)
  const uri = mbean.name
  if (context && uri) {
    let ok = true

    const reply = await jolokiaService.execute(context, ENDPOINT_OPERATIONS.canSendToEndpoint, [uri])
    if (!reply) {
      notify('warning', 'Camel does not support sending to this endpoint.')
      ok = false
    }

    if (ok) {
      if (Object.keys(messageHeaders).length > 0) {
        jolokiaService
          .execute(context, ENDPOINT_OPERATIONS.sendBodyAndHeaders, [uri, body, messageHeaders])
          .then(ok => {
            notify('success', `Message and headers were sent to the ${uri} endpoint`)
          })
      } else {
        jolokiaService.execute(context, ENDPOINT_OPERATIONS.sendStringBody, [uri, body]).then(ok => {
          notify('success', `Message was sent to the ${uri} endpoint`)
        })
      }
    }
  } else {
    if (!mbean) {
      notify('danger', 'Could not find CamelContext MBean!')
    } else {
      notify('danger', 'Failed to determine endpoint name!')
    }
    log.debug('Parsed context and endpoint:', context, mbean)
  }
}

export async function forwardMessagesToEndpoint(
  mBean: MBeanNode,
  uri: string,
  messages: MessageData[],
  notify: (type: NotificationType, message: string) => void,
) {
  const context = mBean.parent?.getProperty(contextNodeType)

  if (context && uri && messages && messages.length) {
    try {
      await jolokiaService.execute(context, ENDPOINT_OPERATIONS.createEndpoint, [uri])
    } catch (err) {
      notify('danger', `Error: ${err}`)
      return
    }

    let forwarded = 0
    for (const message of messages) {
      const body = message.body
      const messageHeaders: Record<string, string> = {}
      if (message.headers.length > 0) {
        message.headers.forEach(header => {
          if (header.key && header.key !== '') {
            messageHeaders[header.key] = header.value
          }
        })
      }
      try {
        await jolokiaService.execute(context, ENDPOINT_OPERATIONS.sendBodyAndHeaders, [uri, body, messageHeaders])
        forwarded++
      } catch (err) {
        notify('danger', `Error: ${err}`)
        return
      }
    }
    const m = forwarded > 1 ? 'messages' : 'message'
    notify('success', `Forwarded ${forwarded} ${m} to endpoint ${uri}`)
  }
}
export async function getMessagesFromTheEndpoint(mbean: MBeanNode, from: number, to: number): Promise<MessageData[]> {
  let messageData: MessageData[] = []
  const context = mbean.parent?.getProperty(contextNodeType)
  const browseAll = to === -1
  if (context) {
    let reply
    if (browseAll) {
      reply = await jolokiaService.execute(mbean.objectName ?? '', ENDPOINT_OPERATIONS.browseAllMessagesAsXml, [true])
    } else {
      reply = await jolokiaService.execute(mbean.objectName ?? '', ENDPOINT_OPERATIONS.browseRangeMessagesAsXml, [
        from,
        to,
        true,
      ])
    }
    const messagesXml = parseXML(reply as string)
    messageData = parseMessagesFromXml(messagesXml)
  }
  return messageData
}

function parseMessagesFromXml(pDoc: XMLDocument): MessageData[] {
  const messagesData: MessageData[] = []
  const messages = pDoc.getElementsByTagName('message')
  for (const message of messages) {
    const headers: { key: string; type: string; value: string }[] = []
    for (const header of message.getElementsByTagName('header')) {
      headers.push({
        key: header.getAttribute('key') ?? '',
        value: header.textContent ?? '',
        type: header.getAttribute('type') ?? '',
      })
    }
    messagesData.push({
      messageId: message.getAttribute('exchangeId') ?? '',
      body: message.getElementsByTagName('body')[0]?.textContent ?? '',
      headers: headers,
    })
  }

  return messagesData
}

export async function getEndpointStatistics(node: MBeanNode) {
  let stats: EndpointStatistics[] = []
  const registry = getDefaultRuntimeEndpointRegistry(node)
  if (registry && registry.objectName) {
    const res = await jolokiaService.execute(registry.objectName, ENDPOINT_OPERATIONS.endpointStatistics)
    stats = Object.values(res as { [key: string]: EndpointStatistics })
  } else {
    log.error('Error with the retrieving the registry')
  }
  return stats
}
