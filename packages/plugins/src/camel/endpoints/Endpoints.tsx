import { MBeanNode, eventService } from '@hawtio/react'
import { Button, Card, CardBody, Text, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core'
import { PlusIcon } from '@patternfly/react-icons'
import { ISortBy, TableComposable, Tbody, Td, Th, ThProps, Thead, Tr } from '@patternfly/react-table'
import React, { useEffect, useState } from 'react'
import { AddEndpoint } from './AddEndpoint'
import { AddEndpointContext, useAddEndpointContext } from './add-endpoint-context'
import * as es from './endpoints-service'

export const Endpoints: React.FunctionComponent = () => {
  const ctx = useAddEndpointContext()
  const [isReading, setIsReading] = useState(false)
  const emptyEndpoints: es.Endpoint[] = []
  const [endpoints, setEndpoints] = useState(emptyEndpoints)
  const [activeSortDirection, setActiveSortDirection] = useState<'asc' | 'desc' | null>('asc')

  useEffect(() => {
    if (!ctx.selectedNode) return

    setIsReading(true)

    const readEndpoints = async () => {
      try {
        const endps = await es.getEndpoints(ctx.selectedNode as MBeanNode)
        setEndpoints(endps)
        const cNames = await es.componentNames(ctx.selectedNode as MBeanNode)
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
  }, [ctx.selectedNode])

  const isAddEnabled = () => {
    return es.canCreateEndpoints(ctx.selectedNode)
  }

  const onAddClicked = () => {
    if (!ctx.selectedNode) return
    ctx.showAddEndpoint(true)
  }

  const sortParams = (): ThProps['sort'] => {
    const sortBy: ISortBy = {
      index: 0,
      defaultDirection: 'asc',
    }
    if (activeSortDirection) sortBy.direction = activeSortDirection

    return {
      columnIndex: 0,
      sortBy: sortBy,
      onSort: (_event, _, direction) => {
        setActiveSortDirection(direction)
      },
    }
  }

  if (!ctx.selectedNode) {
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
          <Text data-testid='loading' component='p'>
            Loading...
          </Text>
        </CardBody>
      </Card>
    )
  }

  if (endpoints.length === 0) {
    return (
      <Card>
        <CardBody>
          <Text data-testid='no-endpoints' component='p'>
            No endpoints
          </Text>
        </CardBody>
      </Card>
    )
  }

  if (ctx.addEndpoint) {
    return (
      <AddEndpointContext.Provider value={ctx}>
        <AddEndpoint />
      </AddEndpointContext.Provider>
    )
  }

  // sorted endpoints is not stored in the state so does not require syncing
  const sortedEndpoints = endpoints
  sortedEndpoints.sort((a, b) => {
    const result = a.uri.localeCompare(b.uri)
    return activeSortDirection === 'desc' ? result * -1 : result
  })

  return (
    <Card isFullHeight>
      <CardBody>
        <Toolbar id='toolbar-items'>
          <ToolbarContent>
            <ToolbarItem>
              <Button
                variant='secondary'
                isSmall={true}
                isDisabled={!isAddEnabled()}
                icon={React.createElement(PlusIcon)}
                onClick={onAddClicked}
              >
                Add
              </Button>
            </ToolbarItem>
            <ToolbarItem variant='separator' />
          </ToolbarContent>
        </Toolbar>
        <TableComposable aria-label='Endpoint Table'>
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
      </CardBody>
    </Card>
  )
}
