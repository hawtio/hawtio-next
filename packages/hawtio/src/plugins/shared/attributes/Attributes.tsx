import { PluginNodeSelectionContext } from '@hawtiosrc/plugins/context'
import { AttributeValues } from '@hawtiosrc/plugins/shared/jolokia-service'
import { isObject } from '@hawtiosrc/util/objects'
import { Card, Drawer, DrawerContent, DrawerContentBody } from '@patternfly/react-core'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import React, { useContext, useEffect, useState } from 'react'
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

  const rows: { name: string; value: string }[] = Object.entries(attributes).map(([name, value]) => ({
    name: name,
    value: isObject(value) ? JSON.stringify(value) : String(value),
  }))

  if (rows.length === 0) {
    return <HawtioEmptyCard message='This MBean has no attributes.' />
  }

  const selectAttribute = (attribute: { name: string; value: string }) => {
    setSelected(attribute)
    if (!isModalOpen) {
      setIsModalOpen(true)
    }
  }

  const panelContent = (
    <AttributeModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onUpdate={() => setReload(true)}
      input={selected}
    />
  )

  const attributesTable = (
    <div style={{ height: '75vh' }}>
      <TableComposable aria-label='Attributes' variant='compact'>
        <Thead>
          <Tr>
            <Th>Attribute</Th>
            <Th>Value</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((att, index) => (
            <Tr
              key={att.name + '-' + index}
              isHoverable
              isRowSelected={selected.name === att.name}
              onRowClick={() => selectAttribute(att)}
            >
              <Td>{att.name}</Td>
              <Td>{att.value}</Td>
            </Tr>
          ))}
        </Tbody>
      </TableComposable>
    </div>
  )
  return (
    <React.Fragment>
      <Card isFullHeight>
        <Drawer isExpanded={isModalOpen} className={'pf-m-inline-on-2xl'}>
          <DrawerContent panelContent={panelContent}>
            <DrawerContentBody hasPadding> {attributesTable}</DrawerContentBody>
          </DrawerContent>
        </Drawer>
      </Card>
    </React.Fragment>
  )
}
