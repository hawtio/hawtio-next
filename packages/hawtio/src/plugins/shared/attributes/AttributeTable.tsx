import { useContext, useEffect, useState } from 'react'
import { Card, CardBody, Text } from '@patternfly/react-core'
import { Table, TableBody, TableHeader, TableProps } from '@patternfly/react-table'
import { PluginNodeSelectionContext } from '@hawtiosrc/plugins/selectionNodeContext'
import { AttributeValues } from '@hawtiosrc/plugins/connect/jolokia-service'
import { attributeService } from './attribute-service'
import './AttributeTable.css'
import { JmxContentMBeans } from '@hawtiosrc/plugins/shared/JmxContentMBeans'
import { humanizeLabels } from '@hawtiosrc/util/strings'

export const AttributeTable: React.FunctionComponent = () => {
  const { selectedNode } = useContext(PluginNodeSelectionContext)
  const [attributesList, setAttributesList] = useState<AttributeValues[]>([{}])
  const [isReading, setIsReading] = useState<boolean>(false)

  useEffect(() => {
    if (!selectedNode) {
      return
    }

    const readAttributes = async () => {
      const childrenMbeansAttributes: AttributeValues[] = []
      setIsReading(true)
      if (selectedNode.children)
        for (const mbean of selectedNode.children) {
          const objectName = mbean.objectName
          if (objectName) {
            const attrs = await attributeService.read(objectName)
            childrenMbeansAttributes.push(attrs)
          }
        }
      setAttributesList([...childrenMbeansAttributes])
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

  const checkIfAllMBeansHaveSameAttributes = (attributesList: AttributeValues[]) => {
    if (attributesList.length <= 1) {
      return true
    }

    const firstMBeanAttributesElements = attributesList[0].length

    if (!attributesList.every(mbeanAttributes => mbeanAttributes.length === firstMBeanAttributesElements)) {
      return false
    }

    const labelSet: Set<string> = new Set()
    Object.keys(attributesList[0]).forEach(label => labelSet.add(label))

    return attributesList.every(attribute => Object.keys(attribute).every(label => labelSet.has(label)))
  }

  if (
    attributesList.some(attribute => Object.entries(attribute).length === 0) ||
    !checkIfAllMBeansHaveSameAttributes(attributesList)
  ) {
    return <JmxContentMBeans />
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
