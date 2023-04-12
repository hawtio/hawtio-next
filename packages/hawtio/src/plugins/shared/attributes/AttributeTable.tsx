import { useContext } from 'react'
import { Card } from '@patternfly/react-core'
import { Table, TableBody, TableHeader, TableProps } from '@patternfly/react-table'
import { PluginNodeSelectionContext } from '@hawtiosrc/plugins/selectionNodeContext'
import { AttributeValues } from '@hawtiosrc/plugins/connect/jolokia-service'
import './AttributeTable.css'
import { JmxContentMBeans } from '@hawtiosrc/plugins/shared/JmxContentMBeans'
import { humanizeLabels } from '@hawtiosrc/util/strings'
import { MBeanAttributes } from '@hawtiosrc/plugins/selection-node-data-service'
import { isObject } from '@hawtiosrc/util/objects'

export const AttributeTable: React.FunctionComponent = () => {
  const { selectedNode, selectedNodeAttributes } = useContext(PluginNodeSelectionContext)
  
  const attributesList: AttributeValues[] = Object.values(selectedNodeAttributes.children)
    .filter((mbeanAttribute): mbeanAttribute is MBeanAttributes => isObject(mbeanAttribute))
    .map(mbeanAttribute => mbeanAttribute.data)

  if (!selectedNode) {
    return null
  }

  const labels = Object.keys(attributesList[0])
  const columns: TableProps['cells'] = labels.map(label => humanizeLabels(label))
  const rows: TableProps['rows'] = attributesList.map(attribute =>
    labels.map(label => JSON.stringify(attribute[label])),
  )

  return (
    <Card isFullHeight>
      <Table aria-label='MBeans' variant='compact' cells={columns} rows={rows}>
        <TableHeader className={'attribute-table'} />
        <TableBody />
      </Table>
    </Card>
  )
}
