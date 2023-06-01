import { Card, CardBody, CardHeader, CardTitle, Skeleton, Text } from '@patternfly/react-core'
import React, { useContext, useEffect, useState } from 'react'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { CamelContext } from '../context'
import { ProfileData, profileService } from './profile-service'
import { IResponse } from 'jolokia.js'
import { log } from '../globals'

export const Profile: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const [isReading, setIsReading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData[]>([])

  useEffect(() => {
    if (!selectedNode) return

    setIsReading(true)

    const profile = async () => {
      setProfileData(await profileService.getProfile(selectedNode))
      setIsReading(false)
    }

    profile()

    /*
     * Sets up polling and live updating of tracing
     */
    profileService.register(
      {
        type: 'exec',
        mbean: selectedNode.objectName as string,
        operation: 'dumpRouteStatsAsXml()',
      },
      (response: IResponse) => {
        log.debug('Scheduler - Debug:', response.value)
        profile()
      },
    )

    // Unregister old handles
    return () => profileService.unregisterAll()
  }, [selectedNode])

  if (!selectedNode) {
    return (
      <Card>
        <CardBody>
          <Text component='p'>No selection has been made</Text>
        </CardBody>
      </Card>
    )
  }

  if (isReading) {
    return (
      <Card>
        <CardBody>
          <Skeleton data-testid='loading' screenreaderText='Loading...' />
        </CardBody>
      </Card>
    )
  }

  return (
    <Card isFullHeight>
      <CardHeader>
        <CardTitle>Profiling</CardTitle>
      </CardHeader>
      <CardBody>
        <TableComposable aria-label='message table' variant='compact' isStriped>
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Count</Th>
              <Th>Last</Th>
              <Th>Delta</Th>
              <Th>Mean</Th>
              <Th>Min</Th>
              <Th>Max</Th>
              <Th>Total</Th>
              <Th>Self</Th>
            </Tr>
          </Thead>
          <Tbody isOddStriped>
            {profileData.map(pd => (
              <Tr key={pd.id}>
                <Td dataLabel='ID'>{pd.id}</Td>
                <Td dataLabel='Count'>{pd.count}</Td>
                <Td dataLabel='Last'>{pd.last}</Td>
                <Td dataLabel='Delta'>{pd.delta}</Td>
                <Td dataLabel='Mean'>{pd.mean}</Td>
                <Td dataLabel='Min'>{pd.min}</Td>
                <Td dataLabel='Max'>{pd.max}</Td>
                <Td dataLabel='Total'>{pd.total}</Td>
                <Td dataLabel='Self'>{pd.self}</Td>
              </Tr>
            ))}
          </Tbody>
        </TableComposable>
      </CardBody>
    </Card>
  )
}
