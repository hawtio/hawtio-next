import { isEmpty } from '@hawtio/util/objects'
import { Card, CardBody, DataList, Text, TextVariants } from '@patternfly/react-core'
import React, { useContext } from 'react'
import { MBeanTreeContext } from '../context'
import { Operation } from './Operation'
import './Operations.css'
import { InfoCircleIcon } from '@patternfly/react-icons'

export const Operations: React.FunctionComponent = () => {
  const { node } = useContext(MBeanTreeContext)

  if (!node || !node.mbean) {
    return null
  }

  const operations = node.mbean.op

  if (isEmpty(operations)) {
    return (
      <Card>
        <CardBody>
          <Text component="p">
            <InfoCircleIcon /> This MBean has no JMX operations.
          </Text>
        </CardBody>
      </Card>
    )
  }

  const OperationList = () => (
    <DataList
      id="jmx-operation-list"
      aria-label="operation list"
      isCompact
    >
      {Object.entries(operations).map(([name, operation]) => (
        <Operation key={name} name={name} operation={operation} />
      ))}
    </DataList>
  )

  return (
    <Card isFullHeight>
      <CardBody>
        <Text component={TextVariants.p}>
          This MBean supports the following JMX operations. Expand an item in the list to invoke that operation.
        </Text>
      </CardBody>
      <CardBody>
        <OperationList />
      </CardBody>
    </Card>
  )
}
