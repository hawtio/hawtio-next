import { eventService } from '@hawtiosrc/core'
import { HawtioEmptyCard, HawtioLoadingCard } from '@hawtiosrc/plugins/shared'
import { Button, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core'
import { PlusIcon } from '@patternfly/react-icons'
import { ISortBy, TableComposable, Tbody, Td, Th, ThProps, Thead, Tr } from '@patternfly/react-table'
import React, { useContext, useEffect, useState } from 'react'
import { CamelContext } from '../context'
import { AddEndpoint } from './AddEndpoint'
import { AddEndpointContext, useAddEndpointContext } from './context'
import * as es from './endpoints-service'

export const Endpoints: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const ctx = useAddEndpointContext()
  const [isReading, setIsReading] = useState(false)
  const emptyEndpoints: es.Endpoint[] = []
  const [endpoints, setEndpoints] = useState(emptyEndpoints)
  const [activeSortDirection, setActiveSortDirection] = useState<'asc' | 'desc' | null>('asc')

  useEffect(() => {
    if (!selectedNode) return

    setIsReading(true)
    const readEndpoints = async () => {
      try {
        const endps = await es.getEndpoints(selectedNode)
        setEndpoints(endps)
        const cNames = await es.componentNames(selectedNode)
        ctx.setComponentNames(cNames)
      } catch (error) {
        eventService.notify({
          type: 'warning',
          message: error as string,
        })
      }
      setIsReading(false)
    }
    readEndpoints()

    /*
     * lint reporting that ctx should be a dependency which it really doesn't
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode])

  if (!selectedNode) {
    return null
  }

  if (isReading) {
    return <HawtioLoadingCard />
  }

  if (endpoints.length === 0) {
    return <HawtioEmptyCard message='No endpoints found.' />
  }

  if (ctx.addEndpoint) {
    return (
      <AddEndpointContext.Provider value={ctx}>
        <AddEndpoint />
      </AddEndpointContext.Provider>
    )
  }

  const isAddEnabled = () => es.canCreateEndpoints(selectedNode)

  const onAddClicked = () => ctx.showAddEndpoint(true)

  const sortParams = (): ThProps['sort'] => {
    const sortBy: ISortBy = {
      index: 0,
      defaultDirection: 'asc',
    }
    if (activeSortDirection) sortBy.direction = activeSortDirection

    return {
      columnIndex: 0,
      sortBy: sortBy,
      onSort: (_event, _index, direction) => setActiveSortDirection(direction),
    }
  }

  // sorted endpoints is not stored in the state so does not require syncing
  const sortedEndpoints = endpoints
  sortedEndpoints.sort((a, b) => {
    const result = a.uri.localeCompare(b.uri)
    return activeSortDirection === 'desc' ? result * -1 : result
  })

  return (
    <React.Fragment>
      <Toolbar id='camel-endpoints-toolbar'>
        <ToolbarContent>
          <ToolbarItem id='camel-endpoints-toolbar-item-add'>
            <Button
              variant='secondary'
              isSmall={true}
              isDisabled={!isAddEnabled()}
              icon={<PlusIcon />}
              onClick={onAddClicked}
            >
              Add
            </Button>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <TableComposable id='camel-endpoints-table' aria-label='Camel endpoints table' variant='compact'>
        <Thead>
          <Tr>
            <Th sort={sortParams()}>URI</Th>
            <Th modifier='wrap'>State</Th>
          </Tr>
        </Thead>
        <Tbody>
          {sortedEndpoints.map(endpoint => (
            <Tr key={endpoint.mbean}>
              <Td dataLabel={endpoint.uri}>{endpoint.uri}</Td>
              <Td dataLabel={endpoint.state}>{endpoint.state}</Td>
            </Tr>
          ))}
        </Tbody>
      </TableComposable>
    </React.Fragment>
  )
}
