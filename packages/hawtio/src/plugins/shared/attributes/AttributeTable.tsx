import { useContext, useEffect, useState } from 'react'
import { Card, CardBody, Text } from '@patternfly/react-core'
import { Table, TableBody, TableHeader, TableProps } from '@patternfly/react-table'
import { PluginNodeSelectionContext } from '@hawtiosrc/plugins/selectionNodeContext'
import { AttributeValues } from '@hawtiosrc/plugins/connect/jolokia-service'
import { attributeService } from './attribute-service'
import './AttributeTable.css'
import { NodeNameTable } from './NodeNameTable'

export const AttributeTable: React.FunctionComponent = () => {
  const { selectedNode } = useContext(PluginNodeSelectionContext)
  const [attributes, setAttributes] = useState<AttributeValues[]>([{}])
  const [isReading, setIsReading] = useState<boolean>(false)

  useEffect(() => {
    if (!selectedNode) {
      return
    }

    const childrenMbeansAttributes: AttributeValues[] = []
    const readAttributes = async () => {
      setIsReading(true)
      if (selectedNode.children)
        for (const mbean of selectedNode.children) {
          const objectName = mbean.objectName
          if (objectName) {
            const attrs = await attributeService.read(objectName)
            childrenMbeansAttributes.push(attrs)
          }
        }
      setAttributes([...childrenMbeansAttributes])
      setIsReading(false)
    }
    readAttributes()
  }, [selectedNode])

  if (!selectedNode) {
    return null
  }

  if (isReading) {
    return (
      <Card>
        <CardBody>
          <Text component='p'>Reading attributes...</Text>
        </CardBody>
      </Card>
    )
  }

  const tidyLabels = (str: string) =>
    str
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
      .replace(/^./, function (str) {
        return str.toUpperCase()
      })

  const columns: TableProps['cells'] = Object.keys(attributes[0]).map(label => tidyLabels(label))
  const rows: TableProps['rows'] = attributes.map(attribute =>
    Object.values(attribute).flatMap(value => JSON.stringify(value)),
  )

  if (columns.length === 0 || rows.length === 0) {
    return <NodeNameTable />
  }

  return (
    <Card isFullHeight>
      <Table aria-label='MBeans' variant='compact' cells={columns} rows={rows}>
        <TableHeader className={'attribute-table'} />
        <TableBody />
      </Table>
    </Card>
  )
}
