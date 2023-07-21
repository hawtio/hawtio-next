import { PluginNodeSelectionContext } from '@hawtiosrc/plugins/context'
import { JmxContentMBeans } from '@hawtiosrc/plugins/shared/JmxContentMBeans'
import { AttributeValues } from '@hawtiosrc/plugins/shared/jolokia-service'
import { humanizeLabels } from '@hawtiosrc/util/strings'
import { Card } from '@patternfly/react-core'
import { Table, TableBody, TableHeader, TableProps } from '@patternfly/react-table'
import { IResponse } from 'jolokia.js'
import { useContext, useEffect, useState } from 'react'
import { HawtioEmptyCard } from '../HawtioEmptyCard'
import { HawtioLoadingCard } from '../HawtioLoadingCard'
import { MBeanNode } from '../tree'
import './AttributeTable.css'
import { attributeService } from './attribute-service'

export const AttributeTable: React.FunctionComponent = () => {
  const { selectedNode } = useContext(PluginNodeSelectionContext)
  const [attributesList, setAttributesList] = useState<{ [name: string]: AttributeValues }>({})
  const [isReading, setIsReading] = useState(false)

  const attributesEntries = Object.values(attributesList)

  function checkIfAllMBeansHaveSameAttributes(attributesEntries: AttributeValues[]): boolean {
    if (attributesEntries.length <= 1) {
      return true
    }

    const firstEntry = attributesEntries[0]
    if (!firstEntry) {
      return false
    }
    const firstAttrsLength = Object.keys(firstEntry).length
    if (attributesEntries.some(attrs => Object.keys(attrs).length !== firstAttrsLength)) {
      return false
    }

    const labelSet = Object.keys(firstEntry).reduce((set, label) => set.add(label), new Set<string>())
    return attributesEntries.every(attrs => Object.keys(attrs).every(label => labelSet.has(label)))
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
    return <HawtioLoadingCard />
  }

  if (attributesEntries.length === 0) {
    return <HawtioEmptyCard message='This node has no MBeans.' />
  }

  if (
    attributesEntries.some(attribute => Object.entries(attribute).length === 0) ||
    !checkIfAllMBeansHaveSameAttributes(attributesEntries)
  ) {
    return <JmxContentMBeans />
  }

  const labels = Object.keys(attributesEntries[0] ?? {})
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
