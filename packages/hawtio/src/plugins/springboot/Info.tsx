import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import React, { useEffect, useState } from 'react'
import { springbootService } from './springboot-service'
import './Info.css'

export const Info: React.FunctionComponent = () => {
  const [systemProperties, setSystemProperties] = useState<{ key: string; value: string }[]>([])

  useEffect(() => {
    springbootService.getInfo().then(props => {
      setSystemProperties(props)
    })
  }, [])

  return (
    <Table aria-label='Message Table' variant='compact' height='80vh' isStriped isStickyHeader>
      <Thead>
        <Tr>
          <Th data-testid='name-header'>Property Name</Th>
          <Th data-testid='value-header'>Property Value</Th>
        </Tr>
      </Thead>
      <Tbody>
        {systemProperties.map((prop, index) => {
          return (
            <Tr key={'row' + index} data-testid={'row' + index}>
              <Td style={{ width: '20%' }}>{prop.key}</Td>
              <Td style={{ flex: 3 }}>{prop.value}</Td>
            </Tr>
          )
        })}
      </Tbody>
    </Table>
  )
}
