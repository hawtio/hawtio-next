import { JolokiaListMethod, MBeanNode, MBeanTree, TreeProcessor, jolokiaService } from '@hawtiosrc/plugins/shared'
import { operationToString } from '@hawtiosrc/util/jolokia'
import { isString } from '@hawtiosrc/util/objects'
import { isBlank } from '@hawtiosrc/util/strings'
import { IJmxOperation, IRequest, IResponse } from 'jolokia.js'
import { log } from './globals'
import { rbacService } from './rbac-service'

/**
 * Process JMX tree and attach RBAC info (canInvoke) to it in advance.
 *
 * Matrix of supported RBAC MBeans per platform:
 * +-------------------------+-----------+--------------+---------------+----------------+
 * |        Platform         | ACL MBean | RBACRegistry | RBACDecorator | Process method |
 * +-------------------------+-----------+--------------+---------------+----------------+
 * | Karaf                   | o         | o            | o             | (built-in)     |
 * | WildFly                 | x (dummy) | o            | x             | processRBAC()  |
 * | Spring Boot             | x (dummy) | o            | x             | processRBAC()  |
 * | Artemis                 | o         | o            | x             | processRBAC()  |
 * | Jolokia (no hawtio.war) | x         | x            | x             | processRBAC()  |
 * +-------------------------+-----------+--------------+---------------+----------------+
 *
 * Object names for the RBAC MBeans:
 * - ACL MBean:     "*:type=security,area=jmx,*"
 * - RBACRegistry:  "hawtio:type=security,name=RBACRegistry"
 * - RBACDecorator: "hawtio:type=security,area=jolokia,name=RBACDecorator"
 */
export const rbacTreeProcessor: TreeProcessor = async (tree: MBeanTree) => {
  log.debug('Processing tree:', tree)
  const aclMBean = await rbacService.getACLMBean()

  if (isBlank(aclMBean)) {
    /*
     * Some implementations of jolokia provision, eg. running with java -javaagent
     * do not provide an acl mbean or implement server-side RBAC so need to skip
     */
    log.debug('No acl mbean available. RBAC decoration of JMX tree skipped')
    return
  }

  const mbeans = tree.flatten()
  const listMethod = await jolokiaService.getListMethod()
  switch (listMethod) {
    case JolokiaListMethod.OPTIMISED: {
      log.debug('Process JMX tree: optimised list mode')
      // Check if RBACDecorator has been already applied to the MBean tree at server side.
      const decorated = Object.values(mbeans).every(node => node.isRBACDecorated())
      if (decorated) {
        log.debug('JMX tree already decorated with RBAC')
        // The tree already has everything related to RBAC in place including icons
      } else {
        log.debug('JMX tree not decorated with RBAC, fetching RBAC info now')
        await processRBAC(aclMBean, mbeans)
      }
      log.debug('Processed tree mbeans with RBAC:', mbeans)
      break
    }
    case JolokiaListMethod.DEFAULT:
    case JolokiaListMethod.UNDETERMINED:
    default:
      log.debug('Process JMX tree: general mode')
      await processRBAC(aclMBean, mbeans)
      log.debug('Processed tree mbeans:', mbeans)
  }
}

type BulkRequest = { [name: string]: string[] }

async function processRBAC(aclMBean: string, mbeans: Record<string, MBeanNode>) {
  const requests: IRequest[] = []
  const bulkRequest: BulkRequest = {}
  // register canInvoke requests for each MBean and accumulate bulkRequest for all ops
  Object.entries(mbeans).forEach(([mbeanName, node]) => {
    addCanInvokeRequests(aclMBean, mbeanName, node, requests, bulkRequest)
  })
  // register the bulk request finally based on the accumulated bulkRequest
  requests.push({
    type: 'exec',
    mbean: aclMBean,
    operation: 'canInvoke(java.util.Map)',
    arguments: [bulkRequest],
  })
  // send batch request
  log.debug('Batch canInvoke request:', requests)
  const responses = await jolokiaService.bulkRequest(requests)
  log.debug('Batch canInvoke response:', responses)
  responses.forEach(response => applyCanInvoke(mbeans, response))
}

function addCanInvokeRequests(
  aclMBean: string,
  mbeanName: string,
  node: MBeanNode,
  requests: IRequest[],
  bulkRequest: BulkRequest,
) {
  // request for MBean
  requests.push({
    type: 'exec',
    mbean: aclMBean,
    operation: 'canInvoke(java.lang.String)',
    arguments: [mbeanName],
  })
  // bulk request for MBean ops
  if (node.mbean?.op) {
    const opList: string[] = []
    Object.entries(node.mbean.op).forEach(([opName, op]) => {
      if (Array.isArray(op)) {
        // overloaded ops
        op.forEach(op => addOperation(node, opList, opName, op))
      } else {
        // single op
        addOperation(node, opList, opName, op)
      }
    })
    if (opList.length > 0) {
      bulkRequest[mbeanName] = opList
    }
  }
}

function addOperation(node: MBeanNode, opList: string[], opName: string, op: IJmxOperation) {
  if (!node.mbean) {
    return
  }

  const opString = operationToString(opName, op.args)

  // enrich the mbean by indexing the full operation string so we can easily look it up later
  if (!node.mbean.opByString) {
    node.mbean.opByString = {}
  }
  node.mbean.opByString[opString] = op

  opList.push(opString)
}

type BulkResponse = { [name: string]: Operations }
type Operations = { [name: string]: Operation }
type Operation = { ObjectName: string; Method: string; CanInvoke: boolean }

function applyCanInvoke(mbeans: Record<string, MBeanNode>, response: IResponse) {
  if (response.request.type !== 'exec') {
    return
  }
  const requestMBean = response.request.arguments?.[0]
  if (isString(requestMBean)) {
    // single mbean request
    const mbean = mbeans[requestMBean]
    // update canInvoke and icon on the mbean node
    mbean?.updateCanInvoke(response.value as boolean)
  } else {
    // batch mbean ops request
    const bulkResponse: BulkResponse = response.value as BulkResponse
    log.debug('Bulk operations response:', bulkResponse)
    // apply canInvoke to op and opByString on each mbean node
    Object.entries(bulkResponse).forEach(([mbeanName, ops]) =>
      Object.entries(ops).forEach(([opName, op]) => {
        const mbean = mbeans[mbeanName]
        const mbeanOp = mbean?.mbean?.opByString?.[opName]
        if (mbeanOp) {
          mbeanOp.canInvoke = op.CanInvoke
        }
      }),
    )
  }
}
