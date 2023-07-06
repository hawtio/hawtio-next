import { eventService } from '@hawtiosrc/core'
import { HawtioEmptyCard, HawtioLoadingCard, workspace } from '@hawtiosrc/plugins/shared'
import { objectSorter } from '@hawtiosrc/util/objects'
import {
  Button,
  Dropdown,
  DropdownItem,
  KebabToggle,
  Modal,
  ModalVariant,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core'
import { AsleepIcon, PlayIcon, Remove2Icon } from '@patternfly/react-icons'
import { TableComposable, Tbody, Td, Th, ThProps, Thead, Tr } from '@patternfly/react-table'
import React, { useContext, useEffect, useState } from 'react'
import { CamelContext } from '../context'
import { CamelRoute, ROUTE_OPERATIONS, routesService } from '../routes-service'

export const CamelRoutes: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const [routes, setRoutes] = useState<CamelRoute[]>([])
  const [isReading, setIsReading] = useState(true)
  const [reload, setReload] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
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

      timeoutHandle = setTimeout(getRouteAttributes, 10000)
    }

    getRouteAttributes()

    return () => timeoutHandle && clearTimeout(timeoutHandle)
  }, [selectedNode, reload])

  if (!selectedNode) {
    return null
  }

  if (isReading) {
    return <HawtioLoadingCard />
  }

  if (routes.length === 0) {
    return <HawtioEmptyCard message='This context does not have any routes.' />
  }

  const onDropdownToggle = (isOpen: boolean) => {
    setIsDropdownOpen(isOpen)
  }

  const onSelect = (routeId: string, isSelecting: boolean) => {
    const selectedRoutes = selected.filter(r => routeId !== r)
    setSelected(isSelecting ? [...selectedRoutes, routeId] : [...selectedRoutes])
  }

  const onSelectAll = (isSelected: boolean) => {
    const selected = routes.map(r => r.RouteId)
    setSelected(isSelected ? selected : [])
  }

  const isAllSelected = (): boolean => {
    return selected.length === routes.length
  }

  const isSuspendEnabled = (state: string): boolean => {
    let res = false
    selected.forEach(id => {
      const route = routes.find(r => r.RouteId === id)
      if (route && route.State === state) res = true
    })
    return res
  }

  const stopRoutes = async () => {
    let stoppedCount = 0
    for (const routeId of selected) {
      const route = routes.find(r => r.RouteId === routeId && r.State === 'Started')
      if (!route || !route.objectName) {
        continue
      }
      try {
        await routesService.stopRoute(route.objectName)
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
    setReload(!reload)
  }

  const startRoutes = async () => {
    let startedCount = 0
    for (const routeId of selected) {
      const route = routes.find(r => r.RouteId === routeId && r.State === 'Stopped')
      if (!route || !route.objectName) {
        continue
      }
      try {
        await routesService.startRoute(route.objectName)
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
    setReload(!reload)
  }

  const onDeleteClicked = () => {
    handleConfirmDeleteToggle()
    setIsDropdownOpen(false)
  }

  const handleConfirmDeleteToggle = () => {
    setIsConfirmDeleteOpen(!isConfirmDeleteOpen)
  }

  const getSortableRoutes = (route: CamelRoute): (number | string)[] => {
    const {
      RouteId,
      State,
      Uptime,
      ExchangesCompleted,
      ExchangesFailed,
      FailuresHandled,
      ExchangesTotal,
      ExchangesInflight,
      MeanProcessingTime,
    } = route

    return [
      RouteId,
      State ?? '',
      Uptime,
      ExchangesCompleted,
      ExchangesFailed,
      FailuresHandled,
      ExchangesTotal,
      ExchangesInflight,
      MeanProcessingTime,
    ]
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

  const sortRoutes = (): CamelRoute[] => {
    let sortedRoutes = routes
    if (activeSortIndex >= 0) {
      sortedRoutes = routes.sort((a, b) => {
        const aValue = getSortableRoutes(a)[activeSortIndex]
        const bValue = getSortableRoutes(b)[activeSortIndex]
        return objectSorter(aValue, bValue, activeSortDirection === 'desc')
      })
    }
    return sortedRoutes
  }

  const deleteRoutes = async () => {
    let deleted = 0
    for (const routeId of selected) {
      const route = routes.find(r => r.RouteId === routeId && r.State === 'Stopped')
      if (!route || !route.objectName) {
        continue
      }
      try {
        await routesService.deleteRoute(route.objectName)
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
      variant={ModalVariant.small}
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
      <p>You are about to delete selected camel routes.</p>
      <p>This operation cannot be undone so please be careful.</p>
    </Modal>
  )

  const toolbarButtons = (
    <React.Fragment>
      <ToolbarItem>
        <Button
          variant='primary'
          isSmall={true}
          isDisabled={!selectedNode.hasInvokeRights(ROUTE_OPERATIONS.start) || !isSuspendEnabled('Stopped')}
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
          isDisabled={!selectedNode.hasInvokeRights(ROUTE_OPERATIONS.stop) || !isSuspendEnabled('Started')}
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
          isDisabled={!selectedNode.hasInvokeRights(ROUTE_OPERATIONS.remove) || !isSuspendEnabled('Stopped')}
          onClick={onDeleteClicked}
        >
          <Remove2Icon /> Delete
        </Button>
      }
    />,
  ]

  return (
    <React.Fragment>
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
          {sortRoutes().map((route, rowIndex) => {
            return (
              <Tr data-testid={'row' + rowIndex} key={route.RouteId}>
                <Td
                  select={{
                    rowIndex,
                    onSelect: (_event, isSelected) => {
                      onSelect(route.RouteId, isSelected)
                    },
                    isSelected: selected.includes(route.RouteId),
                  }}
                />
                <Td dataLabel='Name'>{route.RouteId}</Td>
                <Td dataLabel='State'>{route.State}</Td>
                <Td dataLabel='Uptime'>{route.Uptime}</Td>
                <Td dataLabel='Completed'>{route.ExchangesCompleted}</Td>
                <Td dataLabel='Failed'>{route.ExchangesFailed}</Td>
                <Td dataLabel='Handled'>{route.FailuresHandled}</Td>
                <Td dataLabel='Total'>{route.ExchangesTotal}</Td>
                <Td dataLabel='InFlight'>{route.ExchangesInflight}</Td>
                <Td dataLabel='Meantime'>{route.MeanProcessingTime}</Td>
              </Tr>
            )
          })}
        </Tbody>
      </TableComposable>
      <ConfirmDeleteModal />
    </React.Fragment>
  )
}
