import { eventService } from '@hawtiosrc/core'
import { HawtioEmptyCard, HawtioLoadingCard, workspace } from '@hawtiosrc/plugins/shared'
import { objectSorter } from '@hawtiosrc/util/objects'
import {
  Button,
  Dropdown,
  DropdownItem,
  KebabToggle,
  Modal,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core'
import { AsleepIcon, PlayIcon, Remove2Icon } from '@patternfly/react-icons'
import { TableComposable, Tbody, Td, Th, ThProps, Thead, Tr } from '@patternfly/react-table'
import React, { useContext, useEffect, useState } from 'react'
import { CamelContext } from '../context'
import { CamelRoute } from './route'
import { routesService } from './routes-service'

const ROUTES_REFRESH_INTERVAL = 10000 // milliseconds

export const CamelRoutes: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const [routes, setRoutes] = useState<CamelRoute[]>([])
  const [isReading, setIsReading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [activeSortIndex, setActiveSortIndex] = useState(-1)
  const [activeSortDirection, setActiveSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    if (!selectedNode) {
      return
    }

    setIsReading(true)
    let timeoutHandle: NodeJS.Timeout
    const getRouteAttributes = async () => {
      const routes = await routesService.getRoutesAttributes(selectedNode)
      setRoutes(routes)
      setIsReading(false)

      timeoutHandle = setTimeout(getRouteAttributes, ROUTES_REFRESH_INTERVAL)
    }

    getRouteAttributes()

    return () => timeoutHandle && clearTimeout(timeoutHandle)
  }, [selectedNode])

  if (!selectedNode) {
    return null
  }

  if (isReading) {
    return <HawtioLoadingCard />
  }

  if (routes.length === 0) {
    return <HawtioEmptyCard message='This context does not have any routes.' />
  }

  // Sort routes in place
  if (activeSortIndex >= 0) {
    routes.sort((a, b) => {
      const aValue = a.toArrayForSort()[activeSortIndex]
      const bValue = b.toArrayForSort()[activeSortIndex]
      return objectSorter(aValue, bValue, activeSortDirection === 'desc')
    })
  }

  const onSelect = (routeId: string, isSelecting: boolean) => {
    const selectedRoutes = selected.filter(r => routeId !== r)
    setSelected(isSelecting ? [...selectedRoutes, routeId] : [...selectedRoutes])
  }

  const onSelectAll = (isSelected: boolean) => {
    const selected = routes.map(r => r.routeId)
    setSelected(isSelected ? selected : [])
  }

  const isAllSelected = (): boolean => {
    return selected.length === routes.length
  }

  const handleConfirmDeleteToggle = () => {
    setIsConfirmDeleteOpen(!isConfirmDeleteOpen)
  }

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
      defaultDirection: 'asc', // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index)
      setActiveSortDirection(direction)
    },
    columnIndex,
  })

  const deleteRoutes = async () => {
    let deleted = 0
    for (const routeId of selected) {
      const route = routes.find(r => r.routeId === routeId && r.state === 'Stopped')
      if (!route) {
        continue
      }
      try {
        await routesService.deleteRoute(route.node)
        deleted++
        workspace.refreshTree()
      } catch (error) {
        eventService.notify({
          type: 'danger',
          message: `Couldn't delete the route: ${error}`,
        })
      }
    }
    if (deleted > 0) {
      eventService.notify({
        type: 'success',
        message: `${deleted} routes deleted successfully`,
      })
    }
    setSelected([])
    setRoutes([])
    setIsConfirmDeleteOpen(false)
  }

  const ConfirmDeleteModal = () => (
    <Modal
      variant='small'
      title='Delete Camel Routes'
      titleIconVariant='danger'
      isOpen={isConfirmDeleteOpen}
      onClose={handleConfirmDeleteToggle}
      actions={[
        <Button key='delete' variant='danger' onClick={deleteRoutes}>
          Delete
        </Button>,
        <Button key='cancel' variant='link' onClick={handleConfirmDeleteToggle}>
          Cancel
        </Button>,
      ]}
    >
      <p>You are about to delete the selected camel routes.</p>
      <p>This operation cannot be undone so please be careful.</p>
    </Modal>
  )

  return (
    <React.Fragment>
      <CamelRoutesToolbar
        routes={routes}
        selectedRoutes={selected}
        handleConfirmDeleteToggle={handleConfirmDeleteToggle}
      />
      <TableComposable
        id='camel-routes-table'
        data-testid='camel-routes-table'
        aria-label='Camel routes table'
        variant='compact'
      >
        <Thead>
          <Tr>
            <Th
              select={{
                onSelect: (_event, isSelecting) => onSelectAll(isSelecting),
                isSelected: isAllSelected(),
              }}
            />
            <Th data-testid='name-header' sort={getSortParams(0)}>
              Name
            </Th>
            <Th data-testid='state-header' sort={getSortParams(1)}>
              State
            </Th>
            <Th data-testid='uptime-header' sort={getSortParams(2)}>
              Uptime
            </Th>
            <Th data-testid='completed-header' sort={getSortParams(3)}>
              Completed
            </Th>
            <Th data-testid='failed-header' sort={getSortParams(4)}>
              Failed
            </Th>
            <Th data-testid='handled-header' sort={getSortParams(5)}>
              Handled
            </Th>
            <Th data-testid='total-header' sort={getSortParams(6)}>
              Total
            </Th>
            <Th data-testid='inflight-header' sort={getSortParams(7)}>
              InFlight
            </Th>
            <Th data-testid='meantime-header' sort={getSortParams(8)}>
              Meantime
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {routes.map((route, rowIndex) => {
            return (
              <Tr data-testid={'row' + rowIndex} key={route.routeId}>
                <Td
                  select={{
                    rowIndex,
                    onSelect: (_event, isSelected) => {
                      onSelect(route.routeId, isSelected)
                    },
                    isSelected: selected.includes(route.routeId),
                  }}
                />
                <Td dataLabel='Name'>{route.routeId}</Td>
                <Td dataLabel='State'>{route.state}</Td>
                <Td dataLabel='Uptime'>{route.uptime}</Td>
                <Td dataLabel='Completed'>{route.exchangesCompleted}</Td>
                <Td dataLabel='Failed'>{route.exchangesFailed}</Td>
                <Td dataLabel='Handled'>{route.failuresHandled}</Td>
                <Td dataLabel='Total'>{route.exchangesTotal}</Td>
                <Td dataLabel='InFlight'>{route.exchangesInflight}</Td>
                <Td dataLabel='Meantime'>{route.meanProcessingTime}</Td>
              </Tr>
            )
          })}
        </Tbody>
      </TableComposable>
      <ConfirmDeleteModal />
    </React.Fragment>
  )
}

const CamelRoutesToolbar: React.FunctionComponent<{
  routes: CamelRoute[]
  selectedRoutes: string[]
  handleConfirmDeleteToggle: () => void
}> = ({ routes, selectedRoutes, handleConfirmDeleteToggle }) => {
  const { selectedNode } = useContext(CamelContext)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  if (!selectedNode) {
    return null
  }

  // The first route is sampled only to check RBAC on the route MBean
  const firstRoute = routes[0]
  if (!firstRoute) {
    return null
  }

  const isSuspendEnabled = (state: string): boolean => {
    let res = false
    selectedRoutes.forEach(id => {
      const route = routes.find(r => r.routeId === id)
      if (route && route.state === state) res = true
    })
    return res
  }

  const startRoutes = async () => {
    let startedCount = 0
    for (const routeId of selectedRoutes) {
      const route = routes.find(r => r.routeId === routeId && r.state === 'Stopped')
      if (!route) {
        continue
      }
      try {
        await routesService.startRoute(route.node)
        startedCount++
      } catch (error) {
        eventService.notify({
          type: 'danger',
          message: `Couldn't start the route: ${error}`,
        })
      }
    }

    if (startedCount > 0) {
      eventService.notify({
        type: 'success',
        message: `${startedCount} routes started successfully`,
      })
    }
  }

  const stopRoutes = async () => {
    let stoppedCount = 0
    for (const routeId of selectedRoutes) {
      const route = routes.find(r => r.routeId === routeId && r.state === 'Started')
      if (!route) {
        continue
      }
      try {
        await routesService.stopRoute(route.node)
        stoppedCount++
      } catch (error) {
        eventService.notify({
          type: 'danger',
          message: `Couldn't stop the route: ${error}`,
        })
      }
    }

    if (stoppedCount > 0) {
      eventService.notify({
        type: 'success',
        message: `${stoppedCount} routes stopped successfully`,
      })
    }
  }

  const onDeleteClicked = () => {
    handleConfirmDeleteToggle()
    setIsDropdownOpen(false)
  }

  const onDropdownToggle = (isOpen: boolean) => {
    setIsDropdownOpen(isOpen)
  }

  const toolbarButtons = (
    <React.Fragment>
      <ToolbarItem>
        <Button
          variant='primary'
          isSmall={true}
          isDisabled={!routesService.canStartRoute(firstRoute.node) || !isSuspendEnabled('Stopped')}
          icon={<PlayIcon />}
          onClick={startRoutes}
        >
          Start
        </Button>
      </ToolbarItem>
      <ToolbarItem>
        <Button
          variant='danger'
          isSmall={true}
          isDisabled={!routesService.canStopRoute(firstRoute.node) || !isSuspendEnabled('Started')}
          icon={<AsleepIcon />}
          onClick={stopRoutes}
        >
          Stop
        </Button>
      </ToolbarItem>
    </React.Fragment>
  )

  const dropdownItems = [
    <DropdownItem
      key='action'
      component={
        <Button
          variant='plain'
          isDisabled={!routesService.canDeleteRoute(firstRoute.node) || !isSuspendEnabled('Stopped')}
          onClick={onDeleteClicked}
        >
          <Remove2Icon /> Delete
        </Button>
      }
    />,
  ]

  return (
    <Toolbar id='camel-routes-toolbar'>
      <ToolbarContent>
        {toolbarButtons}
        <ToolbarItem id='camel-routes-toolbar-item-dropdown'>
          <Dropdown
            toggle={<KebabToggle id='camel-routes-toolbar-item-dropdown-toggle' onToggle={onDropdownToggle} />}
            isOpen={isDropdownOpen}
            dropdownItems={dropdownItems}
            isPlain
          />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  )
}
