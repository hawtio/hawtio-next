import { HawtioEmptyCard, HawtioLoadingCard } from '@hawtiosrc/plugins/shared'
import { Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { IResponse } from 'jolokia.js'
import React, { useContext, useEffect, useState } from 'react'
import { CamelContext } from '../context'
import { log } from '../globals'
import { ProfileData, profileService } from './profile-service'

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
    return <HawtioEmptyCard message='No selection has been made.' />
  }

  if (isReading) {
    return <HawtioLoadingCard />
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
