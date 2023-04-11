import { isObject } from '@hawtiosrc/util/objects'
import { Card, CardBody, Text } from '@patternfly/react-core'
import { InfoCircleIcon } from '@patternfly/react-icons'
import { OnRowClick, Table, TableBody, TableHeader, TableProps } from '@patternfly/react-table'
import { useState, useContext } from 'react'
import { PluginNodeSelectionContext } from '@hawtiosrc/plugins/selectionNodeContext'
import { AttributeModal } from './AttributeModal'

export const Attributes: React.FunctionComponent = () => {
  const { selectedNode, selectedNodeAttributes } = useContext(PluginNodeSelectionContext)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selected, setSelected] = useState({ name: '', value: '' })

  if (!selectedNode || !selectedNode.mbean || !selectedNode.objectName) {
    return null
  }

  const columns: TableProps['cells'] = ['Attribute', 'Value']
  const rows: TableProps['rows'] = Object.entries(selectedNodeAttributes?.nodeData?.data ?? {}).map(([name, value]) => [
    name,
    isObject(value) ? JSON.stringify(value) : String(value),
  ])

  if (rows.length === 0) {
    return (
      <Card>
        <CardBody>
          <Text component='p'>
            <InfoCircleIcon /> This MBean has no attributes.
          </Text>
        </CardBody>
      </Card>
    )
  }

  const selectAttribute: OnRowClick = (_event, row) => {
    const name = row[0]
    const value = row[1]
    setSelected({ name, value })
    handleModalToggle()
  }

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen)
  }

  return (
    <Card isFullHeight>
      <Table aria-label='Attributes' variant='compact' cells={columns} rows={rows}>
        <TableHeader />
        <TableBody onRowClick={selectAttribute} />
      </Table>
      <AttributeModal isOpen={isModalOpen} onClose={handleModalToggle} input={selected} />
    </Card>
  )
}
