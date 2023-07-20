import { TableComposable, Tbody, Td, Tr } from '@patternfly/react-table'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import ReactFlow, {
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
} from 'reactflow'
import 'reactflow/dist/style.css'
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

  useEffect(() => {
    if (!selectedNode) {
      return
    }

    const xml = selectedNode.getProperty('xml')
    if (!xml) {
      return
    }

    const { camelNodes, edges } = visualizationService.loadRouteXmlNodes(selectedNode, xml)

    setGraphNodeData(camelNodes.map(camelNode => camelNode.data))

    if (statsXml) {
      visualizationService.updateStats(statsXml, camelNodes)
    }
    const { layoutedNodes, layoutedEdges } = visualizationService.getLayoutedElements(camelNodes, edges)

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
    <div className='camel-route-diagram'>
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        connectionLineType={ConnectionLineType.SmoothStep}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView={true}
        elementsSelectable={true}
        onNodeClick={onNodeClick}
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
      <div className='inflights'>{data.stats?.exchangesInflight} </div>
      <div className='number'>{data.stats?.exchangesCompleted}</div>
      <div className='camel-node-label'> {truncate(data.label)}</div>

      {showStatistics && (
        <NodeToolbar isVisible={isVisible} position={Position.Bottom} style={{ marginTop: '-30px' }}>
          <div className={'node-tooltip'}>
            {!data.stats && data.label}
            {data.stats && !showFull && (
              <TableComposable variant={'compact'}>
                <Tbody style={{ fontSize: 'xx-small' }}>
                  <Tr>
                    <Td>ID</Td>
                    <Td>{data.stats.id}</Td>
                  </Tr>
                  <Tr>
                    <Td>Completed</Td>
                    <Td>{data.stats?.exchangesCompleted}</Td>
                  </Tr>
                  <Tr>
                    <Td>Inflight</Td>
                    <Td>{data.stats?.exchangesInflight}</Td>
                  </Tr>
                  <Tr>
                    <Td>Last</Td>
                    <Td>{data.stats?.lastProcessingTime} (ms)</Td>
                  </Tr>
                  <Tr>
                    <Td>Mean</Td>
                    <Td>{data.stats?.meanProcessingTime} (ms)</Td>
                  </Tr>
                  <Tr>
                    <Td>Mix</Td>
                    <Td>{data.stats?.minProcessingTime} (ms)</Td>
                  </Tr>
                  <Tr>
                    <Td>Max</Td>
                    <Td>{data.stats?.maxProcessingTime} (ms)</Td>
                  </Tr>
                </Tbody>
              </TableComposable>
            )}

            {data.stats && showFull && (
              //TODO finish full statistics
              <TableComposable variant={'compact'}>
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
              </TableComposable>
            )}
          </div>
        </NodeToolbar>
      )}
    </div>
  )
}
