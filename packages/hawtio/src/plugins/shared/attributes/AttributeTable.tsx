import { useContext, useEffect, useState } from 'react'
import { Card, CardBody, Text } from '@patternfly/react-core'
import { Table, TableBody, TableHeader, TableProps } from '@patternfly/react-table'
import { PluginNodeSelectionContext } from '@hawtiosrc/plugins/context'
import { AttributeValues } from '@hawtiosrc/plugins/connect/jolokia-service'
import { attributeService } from './attribute-service'
import './AttributeTable.css'
import { InfoCircleIcon } from '@patternfly/react-icons'
import { JmxContentMBeans } from '@hawtiosrc/plugins/shared/JmxContentMBeans'
import { humanizeLabels } from '@hawtiosrc/util/strings'
import { MBeanNode } from '../tree'
import { IResponse } from 'jolokia.js'

export const AttributeTable: React.FunctionComponent = () => {
  const { selectedNode } = useContext(PluginNodeSelectionContext)
  const [attributesList, setAttributesList] = useState<{ [name: string]: AttributeValues }>({})
  const [isReading, setIsReading] = useState<boolean>(false)
  const attributesEntries = Object.values(attributesList)

  function checkIfAllMBeansHaveSameAttributes(attributesEntries: AttributeValues[]): boolean {
    if (attributesEntries.length <= 1) {
      return true
    }

    const firstMBeanAttributesElements = attributesEntries[0].length

    if (!attributesEntries.every(mbeanAttributes => mbeanAttributes.length === firstMBeanAttributesElements)) {
      return false
    }

    const labelSet: Set<string> = new Set()
    Object.keys(attributesEntries[0]).forEach(label => labelSet.add(label))

    return attributesEntries.every(attributes => Object.keys(attributes).every(label => labelSet.has(label)))
  }

  useEffect(() => {
    if (!selectedNode) {
      return
    }

    const readAttributes = async (currentSelection: MBeanNode) => {
      if (!currentSelection) return

      const childrenMbeansAttributes: { [name: string]: AttributeValues } = {}

      setIsReading(true)

      for (const node of currentSelection.getChildren()) {
        if (!node || !node?.objectName) continue

        const attrs = await attributeService.read(node.objectName)
        childrenMbeansAttributes[node.objectName] = attrs
      }

      setAttributesList({ ...childrenMbeansAttributes })

      setIsReading(false)
    }

    const setJobForSpecificNode = async (node: MBeanNode | null): Promise<void> => {
      if (!node || !node?.objectName) return

      const mbean = node.objectName
      attributeService.register({ type: 'read', mbean }, (response: IResponse) => {
        setAttributesList(attributesList => {
          attributesList[mbean] = response.value as AttributeValues
          return { ...attributesList }
        })
      })
    }

    const setReadingJobs = async (currentSelection: MBeanNode): Promise<void> => {
      if (!currentSelection) return

      currentSelection.getChildren().forEach(async node => await setJobForSpecificNode(node))
    }

    readAttributes(selectedNode)
    setReadingJobs(selectedNode)

    return () => attributeService.unregisterAll()
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

  if (attributesEntries.length === 0) {
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

  if (
    attributesEntries.some(attribute => Object.entries(attribute).length === 0) ||
    !checkIfAllMBeansHaveSameAttributes(attributesEntries)
  ) {
    return <JmxContentMBeans />
  }

  const labels = Object.keys(attributesEntries[0])
  const columns: TableProps['cells'] = labels.map(label => humanizeLabels(label))
  const rows: TableProps['rows'] = attributesEntries.map(attribute =>
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
