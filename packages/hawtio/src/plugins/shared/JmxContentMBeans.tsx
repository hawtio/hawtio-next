import { useContext } from 'react'
import { Card, CardBody, Panel, TextVariants, Text } from '@patternfly/react-core'
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'

import { PluginNodeSelectionContext } from '@hawtiosrc/plugins/context'
import './JmxContentMBeans.css'
import { InfoCircleIcon } from '@patternfly/react-icons'

export const JmxContentMBeans: React.FunctionComponent = () => {
  const { selectedNode, setSelectedNode } = useContext(PluginNodeSelectionContext)

  if (!selectedNode) {
    return null
  }

  const rows: { name: string; objectName: string }[] = (selectedNode.children || []).map(node => ({
    name: node.name,
    objectName: node.objectName ?? '-',
  }))

  if (rows.length === 0) {
    return (
      <Card>
        <CardBody>
          <Text component={TextVariants.p}>
            <InfoCircleIcon /> This node has no MBeans.
          </Text>
        </CardBody>
      </Card>
    )
  }

  const selectChild = (clicked: string) => {
    const child = selectedNode.children?.find(c => c.name === clicked)
    if (child) {
      setSelectedNode(child)
    }
  }

  return (
    <Panel>
      <Table aria-label='MBeans' variant='compact'>
        <Thead>
          <Tr>
            <Th>MBean</Th>
            <Th>Object Name</Th>
          </Tr>
        </Thead>
        <Tbody className={'jmx-table-body'}>
          {rows.map(r => (
            <Tr key={'row-' + r.name} onClick={() => selectChild(r.name)}>
              <Td>{r.name}</Td>
              <Td>{r.objectName}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Panel>
  )
}
