import * as schema from '@hawtio/camel-model'
import { MBeanNode, eventService, jolokiaService, workspace } from '@hawtio/react'
import { isObject } from '@hawtio/react/dist/util'
import * as ccs from '../camel-content-service'
import { endpointsType, log } from '../globals'

export type Endpoint = {
  uri: string
  state: string
  mbean: string
}

export async function getEndpoints(node: MBeanNode): Promise<Endpoint[]> {
  const endpoints: Endpoint[] = []
  const ctxNode = ccs.findContext(node)
  if (!ctxNode || ctxNode.childCount() === 0) return endpoints

  const endPointsNode = ctxNode.get(endpointsType) as MBeanNode
  for (const ep of endPointsNode.getChildren()) {
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

export function canCreateEndpoints(node: MBeanNode | null): boolean {
  return node ? workspace.hasInvokeRights(node, 'createEndpoint') : false
}

export async function componentNames(node: MBeanNode): Promise<string[]> {
  const ctxNode = ccs.findContext(node)
  if (!ctxNode || ctxNode.childCount() === 0 || !ctxNode.objectName) return []

  const names = await jolokiaService.execute(ctxNode.objectName, 'componentNames')
  return names as string[]
}

function notifyError(msg: string) {
  eventService.notify({
    type: 'danger',
    message: msg,
  })
}

export async function createEndpoint(node: MBeanNode, name: string) {
  const ctxNode = ccs.findContext(node)
  if (!ctxNode) {
    notifyError('Could not find the CamelContext!')
    return
  }

  if (!ctxNode.objectName) {
    notifyError('Could not find the CamelContext MBean!')
    return
  }

  jolokiaService
    .execute(ctxNode.objectName, 'createEndpoint(java.lang.String)', [name])
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

export function loadEndpointSchema(node: MBeanNode, componentName: string): Record<string, unknown> | null {
  const ctxNode = ccs.findContext(node)
  if (!ctxNode) {
    eventService.notify({
      type: 'danger',
      message: 'Could not find the CamelContext!',
    })
    return null
  }

  if (!componentName) return null

  if (!schema) return null

  if (!isObject(schema.components)) return null

  const compSchema: Record<string, unknown> = schema.components.components
  return compSchema[componentName] as Record<string, unknown>
}
