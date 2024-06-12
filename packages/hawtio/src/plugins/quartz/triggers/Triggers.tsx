import { HawtioLoadingCard } from '@hawtiosrc/plugins/shared'
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Panel,
  PanelMain,
  PanelMainBody,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  EmptyStateHeader,
  EmptyStateFooter,
  SelectOption,
  Select,
  SelectList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core'
import { SearchIcon } from '@patternfly/react-icons'
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { QuartzContext } from '../context'
import { log } from '../globals'
import { Trigger, TriggerFilter, quartzService } from '../quartz-service'
import { TriggersTableRow } from './TriggersTableRow'

export const Triggers: React.FunctionComponent = () => {
  const { selectedNode } = useContext(QuartzContext)
  const [triggers, setTriggers] = useState<Trigger[]>([])
  const [isReading, setIsReading] = useState(true)
  const [reload, setReload] = useState(false)

  // Filters
  const emptyFilters: TriggerFilter = { state: '', group: '', name: '', type: '' }
  const [filters, setFilters] = useState(emptyFilters)
  // Temporal filter values holder until applying it
  const tempFilters = useRef(emptyFilters)
  const [filteredTriggers, setFilteredTriggers] = useState<Trigger[]>([])
  const [isSelectStateOpen, setIsSelectStateOpen] = useState(false)

  useEffect(() => {
    if (!selectedNode || !selectedNode.objectName) {
      return
    }

    setIsReading(true)
    const { objectName } = selectedNode
    const loadTriggers = async () => {
      const triggers = await quartzService.loadTriggers(objectName)
      setTriggers(triggers)
      setIsReading(false)
    }
    loadTriggers()

    // Watch triggers update
    quartzService.registerTriggersLoad(objectName, triggers => {
      setTriggers(triggers)
    })

    return () => quartzService.unregisterAll()
  }, [selectedNode])

  // When forcing reload
  useEffect(() => {
    if (!selectedNode || !selectedNode.objectName || !reload) {
      return
    }

    log.debug('Reload triggers')

    const { objectName } = selectedNode
    const loadTriggers = async () => {
      const triggers = await quartzService.loadTriggers(objectName)
      setTriggers(triggers)
    }
    loadTriggers()

    setReload(false)
  }, [selectedNode, reload])

  useEffect(() => {
    const filteredTriggers = quartzService.filterTriggers(triggers, filters)
    setFilteredTriggers(filteredTriggers)
  }, [triggers, filters])

  if (!selectedNode || !selectedNode.objectName) {
    return null
  }

  if (isReading) {
    return <HawtioLoadingCard />
  }

  const handleFiltersChange = (target: string, value: string, apply = false) => {
    if (apply || target === 'state') {
      setFilters(prev => ({ ...prev, [target]: value }))
    } else {
      tempFilters.current = { ...tempFilters.current, [target]: value }
    }
  }

  const onStateSelect = (event?: React.MouseEvent | React.ChangeEvent, value?: string | number | undefined) => {
    setFilters(prev => ({ ...prev, state: value == 'State' ? '' : (value as string) }))
  }

  const applyFilters = () => {
    setFilters(prev => ({ ...prev, ...tempFilters.current }))
  }

  const clearAllFilters = () => {
    setFilters(emptyFilters)
    tempFilters.current = emptyFilters
  }

  const triggerStates = ['NORMAL', 'PAUSED']

  const tableToolbar = (
    <Toolbar id='quartz-triggers-table-toolbar' clearAllFilters={clearAllFilters}>
      <ToolbarContent>
        <ToolbarGroup id='quartz-triggers-table-toolbar-filters'>
          <ToolbarItem id='quartz-triggers-table-toolbar-state'>
            <Select
              id='quartz-triggers-table-toolbar-state-select'
              selected={filters.state}
              aria-label='Filter State'
              isOpen={isSelectStateOpen}
              onOpenChange={setIsSelectStateOpen}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle ref={toggleRef} onClick={() => setIsSelectStateOpen(!isSelectStateOpen)}>
                  State
                </MenuToggle>
              )}
              onSelect={onStateSelect}
            >
              <SelectList>
                <SelectOption key={0} value='State'>
                  State
                </SelectOption>
                {triggerStates.map((state, index) => (
                  <SelectOption key={index + 1} value={state}>
                    {state}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </ToolbarItem>
          {['group', 'name', 'type'].map(key => (
            <ToolbarItem key={key} id={`quartz-triggers-table-toolbar-${key}`}>
              <SearchInput
                id={`quartz-triggers-table-toolbar-${key}-input`}
                aria-label={`Filter ${key.charAt(0).toUpperCase() + key.slice(1)}`}
                placeholder={`Filter by ${key}`}
                value={filters[key as keyof TriggerFilter]}
                onChange={(_, value) => handleFiltersChange(key, value)}
                onSearch={() => applyFilters()}
                onClear={() => handleFiltersChange(key, '', true)}
              />
            </ToolbarItem>
          ))}
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  )

  const emptyResult = (
    <Bullseye>
      <EmptyState variant='sm'>
        <EmptyStateHeader titleText='No results found' icon={<EmptyStateIcon icon={SearchIcon} />} headingLevel='h2' />
        <EmptyStateBody>Clear all filters and try again.</EmptyStateBody>
        <EmptyStateFooter>
          <Button variant='link' onClick={clearAllFilters}>
            Clear all filters
          </Button>
        </EmptyStateFooter>
      </EmptyState>
    </Bullseye>
  )

  return (
    <Panel>
      <PanelMain>
        <PanelMainBody>
          {tableToolbar}
          <Table id='quartz-triggers-table' variant='compact' aria-label='Triggers Table' isStriped isStickyHeader>
            <Thead noWrap>
              <Tr>
                <Th>State</Th>
                <Th>Group</Th>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Expression</Th>
                <Th>Misfire Instruction</Th>
                <Th>Previous Fire</Th>
                <Th>Next Fire</Th>
                <Th>Final Fire</Th>
                <Th colSpan={2}>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredTriggers.map((trigger, index) => (
                <TriggersTableRow key={index} trigger={trigger} reload={() => setReload(true)} />
              ))}
              {filteredTriggers.length === 0 && (
                <Tr>
                  <Td colSpan={11}>{emptyResult}</Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </PanelMainBody>
      </PanelMain>
    </Panel>
  )
}
