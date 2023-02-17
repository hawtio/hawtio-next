import {
  Card,
  CardBody,
  Text,
} from '@patternfly/react-core'
import { InfoCircleIcon } from '@patternfly/react-icons'
import { OnRowClick, Table, TableBody, TableHeader, TableProps } from '@patternfly/react-table'
import { MBeanNode } from '@hawtiosrc/plugins/shared/tree'

interface JmxContentBeansProps {
  node: MBeanNode,
  setNode: (node: MBeanNode) => void
}

export const JmxContentMBeans: React.FunctionComponent<JmxContentBeansProps> = (props: JmxContentBeansProps) => {

  if (!props.node) {
    return null
  }

  const columns: TableProps['cells'] = ['MBean', 'Object Name']
  const rows: TableProps['rows'] = (props.node.children || []).map(child => [child.name, child.objectName || '-'])

  if (rows.length === 0) {
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

  const selectChild: OnRowClick = (_event, row) => {
    const clicked = row[0]
    const selected = props.node.children?.find(child => child.name === clicked)
    if (selected) {
      props.setNode(selected)
    }
  }

  return (
    <Card isFullHeight>
      <Table aria-label='MBeans' variant='compact' cells={columns} rows={rows}>
        <TableHeader />
        <TableBody onRowClick={selectChild} />
      </Table>
    </Card>
  )
}
