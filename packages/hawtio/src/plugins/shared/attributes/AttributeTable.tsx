import { useContext, useEffect, useState } from 'react'
import { Card, CardBody, Text } from '@patternfly/react-core'
import { Table, TableBody, TableHeader, TableProps } from '@patternfly/react-table'
import { PluginNodeSelectionContext } from '@hawtiosrc/plugins/selectionNodeContext'
import { AttributeValues } from '@hawtiosrc/plugins/connect/jolokia-service'
import { attributeService } from './attribute-service'
import './AttributeTable.css'
import { tidyLabels } from '../util/helpers'
import { JmxContentMBeans } from '../JmxContentMBeans'

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

  const checkIfAllMBeansHaveSameAttributes = (attributes: AttributeValues[]) => {
    if (attributes.length <= 1) {
      return true
    }

    const firstAttributeElements = attributes[0].length

    if (!attributes.every(attribute => attribute.length === firstAttributeElements)) {
      return false
    }

    return attributes.every(attribute =>
      Object.keys(attribute).every(label => Object.keys(attributes[0]).includes(label)),
    )
  }

  if (
    attributes.some(attribute => Object.keys(attribute).length === 0) ||
    attributes.some(attribute => Object.values(attribute).length === 0) ||
    !checkIfAllMBeansHaveSameAttributes(attributes)
  ) {
    return <JmxContentMBeans />
  }

  const labels = Object.keys(attributes[0])
  const columns: TableProps['cells'] = labels.map(label => tidyLabels(label))
  const rows: TableProps['rows'] = attributes.map(attribute =>
    [...labels].map(label => JSON.stringify(attribute[label])),
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
