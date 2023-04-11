import { Page } from '@patternfly/react-core'
import { TableComposable, Tbody, Td, Tr } from '@patternfly/react-table'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import ReactFlow, {
  Connection,
  ConnectionLineType,
  Edge,
  Handle,
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
import './routeDiagram.css'
import { CamelNodeData, visualizationService } from './visualization-service'

const CamelNode = ({ data, sourcePosition, targetPosition }: NodeProps<CamelNodeData>) => {
  const [isVisible, setVisible] = useState(false)
  const [showFull] = useState(false)

  return (
    <div className='camel-node-content' onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      <Handle type='target' position={targetPosition ?? Position.Top} />
      <Handle type='source' position={sourcePosition ?? Position.Bottom} id='a' />

      <div className={'icon'}>
        {data.imageUrl}
        <div className={'inflights'}> {data.stats?.exchangesInflight} </div>
        <div className='number'>{data.stats?.exchangesCompleted}</div>
      </div>

      <div className={'camel-node-label'}> {data.label}</div>

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
    </div>
  )
}

export const RouteDiagram: React.FunctionComponent = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [statsXml, setStatsXml] = useState('')
  const { selectedNode } = useContext(CamelContext)
  const nodeTypes = useMemo(() => ({ camel: CamelNode }), [])

  useEffect(() => {
    const xml = selectedNode?.getProperty('xml')

    if (xml) {
      const { camelNodes, edges } = visualizationService.loadRouteXmlNodes(xml)
      if (statsXml) {
        visualizationService.updateStats(statsXml, camelNodes)
      }
      const { nodes: layoutedNodes, edges: layoutedEdges } = visualizationService.getLayoutedElements(
        camelNodes,
        edges as Edge[],
      )
      setEdges([...layoutedEdges])
      if (statsXml) {
        const nodesWithStats = visualizationService.updateStats(statsXml, camelNodes)
        setNodes(nodesWithStats)
      } else {
        setNodes([...layoutedNodes])
      }
    }
  }, [selectedNode, setEdges, setNodes, statsXml])

  useEffect(() => {
    const fetchStats = async () => {
      if (selectedNode) {
        const xml = await routesService.dumpRoutesStatsXML(selectedNode)
        if (xml) {
          setStatsXml(xml)
        }
      }
    }
    //fetch for the first time
    fetchStats()
    //fetch periodically
    const interval = setInterval(async () => {
      fetchStats()
    }, 2000)
    return () => clearInterval(interval)
  }, [selectedNode])

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges(eds => addEdge({ ...params, type: ConnectionLineType.SmoothStep, animated: true }, eds)),
    [setEdges],
  )

  return (
    <Page className='route-diagram-page'>
      <div className='route-diagram'>
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={edges}
          connectionLineType={ConnectionLineType.SmoothStep}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView={false}
        />
      </div>
    </Page>
  )
}
