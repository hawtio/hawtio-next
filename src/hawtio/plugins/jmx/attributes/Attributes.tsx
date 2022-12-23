import { AttributeValues } from '@hawtio/plugins/connect/jolokia-service'
import { isObject } from '@hawtio/util/objects'
import { Card, CardBody, Text } from '@patternfly/react-core'
import { InfoCircleIcon } from '@patternfly/react-icons'
import { OnRowClick, Table, TableBody, TableHeader, TableProps } from '@patternfly/react-table'
import { IResponse } from 'jolokia.js'
import { useContext, useEffect, useState } from 'react'
import { MBeanTreeContext } from '../context'
import { attributeService } from './attribute-service'
import { AttributeModal } from './AttributeModal'

const log = console

export const Attributes: React.FunctionComponent = () => {
  const { node } = useContext(MBeanTreeContext)
  const [attributes, setAttributes] = useState<AttributeValues>({})
  const [isReading, setIsReading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selected, setSelected] = useState({ name: '', value: '' })

  useEffect(() => {
    if (!node || !node.mbean || !node.objectName) {
      return
    }

    setIsReading(true)
    const objectName = node.objectName
    const readAttributes = async () => {
      const attrs = await attributeService.read(objectName)
      setAttributes(attrs)
      setIsReading(false)
    }
    readAttributes()
  }, [node])

  useEffect(() => {
    if (!node || !node.mbean || !node.objectName) {
      return
    }

    const objectName = node.objectName

    // TODO: better handling of 'handle' and unregistering
    let handle: number | null = null
    const updateAttributes = async () => {
      handle = await attributeService.register(
        { type: 'read', mbean: objectName },
        (response: IResponse) => {
          log.debug('Attributes:', response.value)
          setAttributes(response.value as AttributeValues)
        },
      )
    }
    updateAttributes()

    return () => { handle && attributeService.unregister(handle) }
  }, [node])

  if (!node || !node.mbean || !node.objectName) {
    return null
  }

  if (isReading) {
    return (
      <Card>
        <CardBody>
          <Text component="p">Reading attributes...</Text>
        </CardBody>
      </Card>
    )

  }

  const columns: TableProps['cells'] = ['Attribute', 'Value']
  const rows: TableProps['rows'] = Object.entries(attributes)
    .map(([name, value]) => [name, isObject(value) ? JSON.stringify(value) : String(value)])

  if (rows.length === 0) {
    return (
      <Card>
        <CardBody>
          <Text component="p">
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
      <Table
        aria-label="Attributes"
        variant="compact"
        cells={columns}
        rows={rows}
      >
        <TableHeader />
        <TableBody onRowClick={selectAttribute} />
      </Table>
      <AttributeModal
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        input={selected}
      />
    </Card>
  )
}
