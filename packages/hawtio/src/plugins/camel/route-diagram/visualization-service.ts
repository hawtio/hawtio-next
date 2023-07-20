import { routesService, RouteStats, Statistics } from '@hawtiosrc/plugins/camel/routes-service'
import { schemaService } from '@hawtiosrc/plugins/camel/schema-service'
import { MBeanNode } from '@hawtiosrc/plugins/shared'
import { parseXML } from '@hawtiosrc/util/xml'
import dagre from 'dagre'
import { ReactNode } from 'react'
import { Edge, MarkerType, Node, Position } from 'reactflow'

export type CamelNodeData = {
  id: string
  routeIdx: number
  name: string
  label: string
  labelSummary: string
  group: 1

  elementId: string | null
  imageUrl: ReactNode
  cid: string
  tooltip: string
  type: string
  uri: string
  routeId: string
  stats?: Statistics

  nodeClicked?: (node: Node) => void
}

class VisualizationService {
  dagreGraph: dagre.graphlib.Graph
  nodeWidth = 250
  nodeHeight = 80
  defaultMaximumLabelWidth = 34
  edgeType = 'smoothstep'
  margin = {
    left: 25,
    top: 25,
  }

  constructor() {
    this.dagreGraph = new dagre.graphlib.Graph()
    this.dagreGraph.setDefaultEdgeLabel(() => ({}))
  }

  getLayoutedElements(
    nodes: Node[],
    edges: Edge[],
    direction = 'TB',
  ): { layoutedNodes: Node[]; layoutedEdges: Edge[] } {
    const isHorizontal = direction === 'LR'
    this.dagreGraph.setGraph({ rankdir: direction })

    nodes.forEach(node => {
      this.dagreGraph.setNode(node.id, { width: this.nodeWidth, height: this.nodeHeight })
    })

    edges.forEach(edge => {
      this.dagreGraph.setEdge(edge.source, edge.target)
    })
    dagre.layout(this.dagreGraph)

    nodes.forEach(node => {
      const nodeWithPosition = this.dagreGraph.node(node.id)
      node.targetPosition = isHorizontal ? Position.Left : Position.Top
      node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom

      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).

      node.position = {
        x: nodeWithPosition.x - this.nodeWidth / 2 + this.margin.left,
        y: nodeWithPosition.y - this.nodeHeight / 2 + this.margin.top,
      }
    })

    return { layoutedNodes: nodes, layoutedEdges: edges }
  }

  getRouteNodeUri(node: Element): string | null {
    if (!node) {
      return null
    }

    const uri = node.getAttribute('uri')
    if (uri) {
      return uri
    }

    const ref = node.getAttribute('ref')
    if (!ref) {
      return null
    }

    const method = node.getAttribute('method')
    return method ? `${ref}.${method}()` : `ref:${ref}`
  }

  loadRouteXmlNodes(node: MBeanNode, xml: string, selectedRouteId?: string): { camelNodes: Node[]; edges: Edge[] } {
    const nodes: CamelNodeData[] = []
    const edges: Edge[] = []
    const doc: XMLDocument = parseXML(xml)

    const allRoutes = doc.getElementsByTagName('route')

    for (const route of allRoutes) {
      const routeId = route.id
      if (!selectedRouteId || !routeId || selectedRouteId === routeId) {
        this.addRouteXmlChildren(node, route, nodes, edges, routeId, '')
      }
    }
    // parse stats
    const camelNodes = nodes.map(node => ({
      id: node.id,
      data: node,
      position: {
        x: 0,
        y: 0,
      },
      type: 'camel',
    }))

    edges.forEach(edge => {
      edge.markerEnd = { type: MarkerType.Arrow }
      edge.type = this.edgeType
      edge.animated = true
    })
    return { camelNodes, edges }
  }

  updateStats(statsXml: string, nodes: Node<CamelNodeData>[]): Node<CamelNodeData>[] {
    const stats: RouteStats[] = routesService.processRoutesStats(statsXml)

    return nodes.map(node => {
      const routeStat = stats.find(s => s.id === node.data.routeId)
      if (node.data.type === 'from') {
        const newData = { ...node.data, stats: routeStat }
        return { ...node, data: newData }
      }
      const pStats = routeStat?.processorStats.find(p => node.data.cid === p.id)
      const newData = { ...node.data, stats: pStats }
      return { ...node, data: newData }
    })
  }

  addRouteXmlChildren(
    node: MBeanNode,
    parent: Element,
    nodeDatas: CamelNodeData[],
    links: Edge[],
    routeId: string,
    parentId: string,
    parentNode: CamelNodeData | null = null,
  ): number[] {
    let rid = parent.getAttribute('id')
    let siblingNodes: number[] = []
    const parenNodeName: string = parent.localName

    /*
     * Whereas the id is unique across all routes in the xml, the
     * routeIdx defines an id for each node in the route so
     */
    let routeIdx = -1
    for (const route of parent.children) {
      const id: string = nodeDatas.length + ''
      routeIdx++
      // from acts as a parent even though its a previous sibling :)
      const nodeId = route.localName
      if (nodeId === 'from' && parentId !== '-1') {
        parentId = id
      }
      const nodeSettings = schemaService.getSchema(node, nodeId)
      let nodeData: CamelNodeData | null = null
      if (nodeSettings) {
        let label: string = (nodeSettings['title'] as string) || (nodeId as string)
        const uri = this.getRouteNodeUri(route)
        if (uri) {
          label += ` ${uri.split('?')[0]}`
        }
        let tooltip = (nodeSettings['tooltip'] || nodeSettings['description'] || label) as string
        if (uri) {
          tooltip += ' ' + uri
        }
        const elementID = route.getAttribute('id')
        let labelSummary = label
        if (elementID) {
          const customId = route.getAttribute('customId')
          if (!customId || customId === 'false') {
            labelSummary = 'id: ' + elementID
          } else {
            label = elementID
          }
        }
        // lets check if we need to trim the label
        const labelLimit = this.defaultMaximumLabelWidth
        const length = label.length
        if (length > labelLimit) {
          labelSummary = label + '\n\n' + labelSummary
          label = label.substring(0, labelLimit) + '..'
        }
        const imageUrl = routesService.getIcon(node, nodeSettings)

        if ((nodeId === 'from' || nodeId === 'to') && uri) {
          const uriIdx = uri.indexOf(':')
          if (uriIdx > 0) {
            const componentScheme = uri.substring(0, uriIdx)
            if (componentScheme) {
              // const value = routesService.getIcon(componentScheme)
              // if (value) {
              //   imageUrl = Core.url(value)
              // }
            }
          }
        }

        let cid = route.getAttribute('_cid') || route.getAttribute('id')
        nodeData = {
          id: id,
          routeIdx: routeIdx,
          name: nodeId,
          label: label,
          labelSummary: labelSummary,
          group: 1,
          elementId: elementID,
          imageUrl: imageUrl,
          cid: cid ?? id,
          tooltip: tooltip,
          type: nodeId,
          uri: uri ?? '',
          routeId: routeId,
        }
        if (rid) {
          nodeData.cid = rid
        }
        if (!cid) {
          cid = nodeId + (nodeDatas.length + 1)
        }
        if (cid) {
          nodeData.cid = cid
        }
        // only use the route id on the first from node
        rid = null
        nodeDatas.push(nodeData)
        if (parentId !== null && parentId !== id) {
          if (siblingNodes.length === 0 || parenNodeName === 'choice') {
            links.push({ id: parentId + '-' + id, source: parentId + '', target: id })
          } else {
            siblingNodes.forEach(function (nodeId) {
              links.push({ id: nodeId + '-' + id, source: nodeId + '', target: id })
            })
            siblingNodes.length = 0
          }
        }
      } else {
        // ignore non EIP nodes, though we should add expressions...
        const langSettings = { name: 'sfd' } // Camel.camelLanguageSettings(nodeId)
        if (langSettings && parentNode) {
          // lets add the language kind
          const name = langSettings['name'] || nodeId
          const text = route.textContent

          if (text) {
            parentNode.tooltip = parentNode.label + ' ' + name + ' ' + text
            parentNode.label += ': ' + this.appendLabel(route, text, true)
          } else {
            parentNode.label += ': ' + this.appendLabel(route, name, false)
          }
        }
      }

      const siblings = this.addRouteXmlChildren(node, route, nodeDatas, links, routeId, id, nodeData)
      if (parenNodeName === 'choice') {
        siblingNodes = siblingNodes.concat(siblings)
      } else if (
        nodeId === 'aggregate' ||
        nodeId === 'choice' ||
        nodeId === 'delay' ||
        nodeId === 'filter' ||
        nodeId === 'loadBalance' ||
        nodeId === 'loop' ||
        nodeId === 'multicast' ||
        nodeId === 'resequence' ||
        nodeId === 'split' ||
        nodeId === 'doTry' ||
        nodeId === 'doCatch' ||
        nodeId === 'doFinally' ||
        nodeId === 'idempotentConsumer' ||
        nodeId === 'onCompletion'
      ) {
        siblingNodes = siblings
      } else {
        siblingNodes = [nodeDatas.length - 1]
      }
    }
    return siblingNodes
  }

  appendLabel(route: Element, label: string, text: boolean): string {
    switch (route.localName) {
      case 'method':
        if (!text) {
          if (route.getAttribute('bean')) {
            label += ' ' + route.getAttribute('bean')
          } else if (route.getAttribute('ref')) {
            label += ' ' + route.getAttribute('ref')
          } else if (route.getAttribute('beanType')) {
            label += ' ' + route.getAttribute('beanType')
          }
        }
        if (route.getAttribute('method')) {
          label += ' ' + route.getAttribute('method')
        }
        break
      default:
    }
    return label
  }
}

export const visualizationService = new VisualizationService()
