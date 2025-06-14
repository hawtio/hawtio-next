import { Table, Tbody, Td, Tr } from '@patternfly/react-table'
import React, { RefObject, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Connection,
  ConnectionLineType,
  Handle,
  Node,
  NodeProps,
  NodeToolbar,
  Position,
  addEdge,
  useEdgesState,
  useNodesState,
  ReactFlowProvider,
  NodeMouseHandler,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  NodeTypes,
  Edge,
  ReactFlowInstance,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { camelPreferencesService } from '../camel-preferences-service'
import { CamelContext } from '../context'
import { routesService } from '../routes-service'
import './RouteDiagram.css'
import { Annotation, RouteDiagramContext } from './context'
import { CamelNodeData, visualizationService } from './visualization-service'

export const RouteDiagram: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const { setGraphNodeData, graphSelection, setGraphSelection } = useContext(RouteDiagramContext)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [statsXml, setStatsXml] = useState('')
  const nodeTypes = useMemo(() => ({ camel: CamelNode }), [])
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedNode) {
      return
    }

    const xml = selectedNode.getMetadata('xml')
    if (!xml) {
      return
    }

    visualizationService.loadRouteXmlNodes(selectedNode, xml).then(({ camelNodes, edges }) => {
      setGraphNodeData(camelNodes.map(camelNode => camelNode.data))

      if (statsXml) {
        visualizationService.updateStats(statsXml, camelNodes)
      }
      const boundingRect = canvasRef.current
        ? canvasRef.current.getBoundingClientRect()
        : { x: 0, y: 0, width: 100, height: 100 }
      const { layoutedNodes, layoutedEdges } = visualizationService.getLayoutedElements(camelNodes, edges, boundingRect)

      layoutedNodes.forEach(node => {
        node.selected = graphSelection === node.data.cid
      })

      setEdges([...layoutedEdges])

      if (statsXml) {
        const nodesWithStats = visualizationService.updateStats(statsXml, layoutedNodes)
        setNodes(nodesWithStats)
      } else {
        setNodes([...layoutedNodes])
      }
    })
  }, [selectedNode, setEdges, setNodes, statsXml, setGraphNodeData, graphSelection])

  useEffect(() => {
    const fetchStats = async () => {
      if (selectedNode) {
        const xml = await routesService.dumpRoutesStatsXML(selectedNode)
        if (xml) {
          setStatsXml(xml)
        }
      }
    }
    // fetch for the first time
    fetchStats()
    // fetch periodically
    const interval = setInterval(() => fetchStats(), 2000)
    return () => clearInterval(interval)
  }, [selectedNode])

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges(eds => addEdge({ ...params, type: ConnectionLineType.SmoothStep, animated: true }, eds)),
    [setEdges],
  )

  if (!selectedNode) {
    return null
  }

  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    setGraphSelection(node.data.cid)
  }

  return (
    <div id='camel-route-diagram-outer-div' ref={canvasRef}>
      <ReactFlowProvider>
        <ReactFlowRouteDiagram
          parent={canvasRef}
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
        />
      </ReactFlowProvider>
    </div>
  )
}

type ReactFlowRouteDiagramProps = {
  parent: RefObject<HTMLDivElement>
  onNodeClick: NodeMouseHandler | undefined
  onConnect: OnConnect | undefined
  onEdgesChange: OnEdgesChange | undefined
  onNodesChange: OnNodesChange | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  edges: Edge<any>[] | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes: Node<any, string | undefined>[] | undefined
  nodeTypes: NodeTypes | undefined
}

const ReactFlowRouteDiagram: React.FunctionComponent<ReactFlowRouteDiagramProps> = props => {
  const onLoad = (reactFlowInstance: ReactFlowInstance) => {
    if (props.parent && props.parent.current) {
      const boundingRect = props.parent.current.getBoundingClientRect()
      reactFlowInstance.fitBounds({
        width: boundingRect.width,
        height: boundingRect.height,
        x: 0,
        y: 0,
      })
    }

    reactFlowInstance.fitView()
  }

  return (
    <div className='camel-route-diagram'>
      <ReactFlow
        nodeTypes={props.nodeTypes}
        nodes={props.nodes}
        edges={props.edges}
        connectionLineType={ConnectionLineType.SmoothStep}
        onNodesChange={props.onNodesChange}
        onEdgesChange={props.onEdgesChange}
        onConnect={props.onConnect}
        elementsSelectable={true}
        onNodeClick={props.onNodeClick}
        onInit={onLoad}
      />
    </div>
  )
}

const CamelNode: React.FunctionComponent<NodeProps<CamelNodeData>> = ({
  data,
  selected,
  sourcePosition,
  targetPosition,
}) => {
  const { showStatistics, doubleClickAction, annotations } = useContext(RouteDiagramContext)
  const [isVisible, setVisible] = useState(false)
  const [showFull] = useState(false)
  const [annotation, setAnnotation] = useState<Annotation | undefined>(undefined)

  const { showInflightCounter } = camelPreferencesService.loadOptions()

  useEffect(() => {
    if (!annotations || annotations.length === 0) {
      setAnnotation(undefined)
      return
    }

    const ann = annotations.find(a => a.nodeId === data.cid)
    setAnnotation(ann)
  }, [annotations, data.cid])

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!doubleClickAction) return

    doubleClickAction(data)
  }

  const truncate = (label: string) => {
    const newline = label.indexOf('\n')
    if (label.length < 20 && newline === -1) return label

    const newLabel = label.replace('\n', ' ')
    return newLabel.substring(0, 17) + '...'
  }

  const totalExchanges: number =
    parseInt(data.stats?.exchangesCompleted ?? '0') + parseInt(data.stats?.exchangesInflight ?? '0')

  return (
    <div
      className={'camel-node-content' + (selected ? ' highlighted' : '')}
      onMouseEnter={() => {
        if (showStatistics) setVisible(true)
      }}
      onMouseLeave={() => {
        if (showStatistics) setVisible(false)
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type='target' position={targetPosition ?? Position.Top} />
      <Handle type='source' position={sourcePosition ?? Position.Bottom} id='a' />
      <div className='annotation'>{annotation?.element}</div>
      <div className='icon'>{data.imageUrl}</div>
      <div className='inflights'>{showInflightCounter && data.stats?.exchangesInflight}</div>
      <div className='number'>{totalExchanges}</div>
      <div className='camel-node-label'>{truncate(data.label)}</div>
      {data.cid && <div className='camel-node-id'> (ID: {data.cid})</div>}
      {showStatistics && (
        <NodeToolbar isVisible={isVisible} position={Position.Bottom} style={{ marginTop: '-30px' }}>
          <div className={'node-tooltip'}>
            {!data.stats && data.label}
            {data.stats && !showFull && (
              <Table variant={'compact'}>
                <Tbody style={{ fontSize: 'xx-small' }}>
                  <Tr className={'node-tooltip-odd-row'}>
                    <Td>ID</Td>
                    <Td className={'node-tooltip-value'}>{data.stats.id}</Td>
                  </Tr>
                  <Tr className={'node-tooltip-even-row'}>
                    <Td>Total</Td>
                    <Td className={'node-tooltip-value'}>{totalExchanges}</Td>
                  </Tr>
                  <Tr className={'node-tooltip-odd-row'}>
                    <Td>Completed</Td>
                    <Td className={'node-tooltip-value'}>{data.stats?.exchangesCompleted}</Td>
                  </Tr>
                  <Tr className={'node-tooltip-even-row'}>
                    <Td>Inflight</Td>
                    <Td className={'node-tooltip-value'}>{data.stats?.exchangesInflight}</Td>
                  </Tr>
                  <Tr className={'node-tooltip-odd-row'}>
                    <Td>Last</Td>
                    <Td className={'node-tooltip-value'}>{data.stats?.lastProcessingTime} (ms)</Td>
                  </Tr>
                  <Tr className={'node-tooltip-even-row'}>
                    <Td>Mean</Td>
                    <Td className={'node-tooltip-value'}>{data.stats?.meanProcessingTime} (ms)</Td>
                  </Tr>
                  <Tr className={'node-tooltip-odd-row'}>
                    <Td>Min</Td>
                    <Td className={'node-tooltip-value'}>{data.stats?.minProcessingTime} (ms)</Td>
                  </Tr>
                  <Tr className={'node-tooltip-even-row'}>
                    <Td>Max</Td>
                    <Td className={'node-tooltip-value'}>{data.stats?.maxProcessingTime} (ms)</Td>
                  </Tr>
                </Tbody>
              </Table>
            )}

            {data.stats && showFull && (
              //TODO finish full statistics
              <Table variant={'compact'}>
                <Tbody style={{ fontSize: 'xx-small' }}>
                  {Object.entries(data.stats).map(s => {
                    return (
                      <Tr key={s[0]}>
                        <Td>{s[0]}</Td>
                        <Td>{s[1]}</Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            )}
          </div>
        </NodeToolbar>
      )}
    </div>
  )
}
