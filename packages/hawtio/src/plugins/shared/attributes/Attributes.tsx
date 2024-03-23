import { PluginNodeSelectionContext } from '@hawtiosrc/plugins/context'
import { AttributeValues } from '@hawtiosrc/plugins/shared/jolokia-service'
import { isObject } from '@hawtiosrc/util/objects'
import { Card } from '@patternfly/react-core'
import { OnRowClick, Table, TableBody, TableHeader, TableProps } from '@patternfly/react-table'
import { useContext, useEffect, useState } from 'react'
import { HawtioEmptyCard } from '../HawtioEmptyCard'
import { HawtioLoadingCard } from '../HawtioLoadingCard'
import { log } from '../globals'
import { AttributeModal } from './AttributeModal'
import { attributeService } from './attribute-service'

export const Attributes: React.FunctionComponent = () => {
  const { selectedNode } = useContext(PluginNodeSelectionContext)
  const [attributes, setAttributes] = useState<AttributeValues>({})
  const [isReading, setIsReading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selected, setSelected] = useState({ name: '', value: '' })
  const [reload, setReload] = useState(false)

  useEffect(() => {
    if (!selectedNode || !selectedNode.mbean || !selectedNode.objectName) {
      return
    }

    setIsReading(true)
    const { objectName } = selectedNode
    attributeService.readWithCallback(objectName, attrs => {
      setAttributes(attrs)
      setIsReading(false)
    })

    attributeService.register({ type: 'read', mbean: objectName }, response => {
      log.debug('Scheduler - Attributes:', response.value)
      setAttributes(response.value as AttributeValues)
    })

    return () => attributeService.unregisterAll()
  }, [selectedNode])

  useEffect(() => {
    if (!selectedNode || !selectedNode.mbean || !selectedNode.objectName || !reload) {
      return
    }

    setIsReading(true)
    const { objectName } = selectedNode
    attributeService.readWithCallback(objectName, attrs => {
      setAttributes(attrs)
      setIsReading(false)
    })

    setReload(false)
  }, [selectedNode, reload])

  if (!selectedNode || !selectedNode.mbean || !selectedNode.objectName) {
    return null
  }

  if (isReading) {
    return <HawtioLoadingCard />
  }

  const columns: TableProps['cells'] = ['Attribute', 'Value']
  const rows: TableProps['rows'] = Object.entries(attributes).map(([name, value]) => [
    name,
    isObject(value) ? JSON.stringify(value) : String(value),
  ])

  if (rows.length === 0) {
    return <HawtioEmptyCard message='This MBean has no attributes.' />
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
      <AttributeModal
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        onUpdate={() => setReload(true)}
        input={selected}
      />
    </Card>
  )
}
