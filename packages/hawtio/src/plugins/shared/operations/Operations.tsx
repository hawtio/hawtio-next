import { isEmpty } from '@hawtiosrc/util/objects'
import { Card, CardBody, DataList, Text } from '@patternfly/react-core'
import { InfoCircleIcon } from '@patternfly/react-icons'
import React, { useContext } from 'react'
import { PluginNodeSelectionContext } from '@hawtiosrc/plugins/selectionNodeContext'
import { createOperations } from './operation'
import { OperationForm } from './OperationForm'
import './Operations.css'

export const Operations: React.FunctionComponent = () => {
  const { selectedNode } = useContext(PluginNodeSelectionContext)

  const OperationList = React.useMemo(
    () => {
      // No other way around it than to check it twice
      if (!selectedNode || !selectedNode.objectName || !selectedNode.mbean) {
        return null
      }

      const operations = createOperations(selectedNode.objectName, selectedNode.mbean.op)

      return (
        <DataList id='jmx-operation-list' aria-label='operation list' isCompact>
          {operations.map(op => (
            <OperationForm key={op.name} name={op.name} operation={op} />
          ))}
        </DataList>
      )
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedNode?.objectName],
  )

  if (!selectedNode || !selectedNode.objectName || !selectedNode.mbean) {
    return null
  }

  if (isEmpty(selectedNode.mbean.op)) {
    return (
      <Card>
        <CardBody>
          <Text component='p'>
            <InfoCircleIcon /> This MBean has no JMX operations.
          </Text>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card isFullHeight>
      <CardBody>
        <Text component='p'>
          This MBean supports the following JMX operations. Expand an item in the list to invoke that operation.
        </Text>
      </CardBody>
      <CardBody>{OperationList}</CardBody>
    </Card>
  )
}
