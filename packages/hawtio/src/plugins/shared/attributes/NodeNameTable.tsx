import { useContext } from 'react'
import { Card, CardBody, Text } from '@patternfly/react-core'
import { InfoCircleIcon } from '@patternfly/react-icons'
import { Table, TableBody, TableHeader, TableProps } from '@patternfly/react-table'
import { PluginNodeSelectionContext } from '@hawtiosrc/plugins/selectionNodeContext'

export const NodeNameTable: React.FunctionComponent = () => {
  const { selectedNode } = useContext(PluginNodeSelectionContext)

  if (!selectedNode) {
    return null
  }

  if (!selectedNode.children) {
    return (
      <Card>
        <CardBody>
          <Text component='p'>
            <InfoCircleIcon /> This node has no MBeans.
          </Text>
        </CardBody>
      </Card>
    )
  }

  const columns: TableProps['cells'] = ['Name']
  const rows: TableProps['rows'] = selectedNode.children?.map(value => [value.name])

  return (
    <Card isFullHeight>
      <Table aria-label='MBeans' variant='compact' cells={columns} rows={rows}>
        <TableHeader />
        <TableBody />
      </Table>
    </Card>
  )
}
