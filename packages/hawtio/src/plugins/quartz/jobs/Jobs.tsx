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
  Select,
  SelectOption,
  SelectList,
  MenuToggleElement,
  MenuToggle,
} from '@patternfly/react-core'

import { SearchIcon } from '@patternfly/react-icons'
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { QuartzContext } from '../context'
import { Job, JobFilter, quartzService } from '../quartz-service'
import { JobsTableRow } from './JobsTableRow'

export const Jobs: React.FunctionComponent = () => {
  const { selectedNode } = useContext(QuartzContext)
  const [jobs, setJobs] = useState<Job[]>([])
  const [isReading, setIsReading] = useState(true)

  // Filters
  const emptyFilters: JobFilter = {
    group: '',
    name: '',
    durability: '',
    shouldRecover: '',
    jobClass: '',
    description: '',
  }
  const [filters, setFilters] = useState(emptyFilters)
  // Temporal filter values holder until applying it
  const tempFilters = useRef(emptyFilters)
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [isSelectDurableOpen, setIsSelectDurableOpen] = useState(false)
  const [isSelectRecoverOpen, setIsSelectRecoverOpen] = useState(false)

  useEffect(() => {
    if (!selectedNode || !selectedNode.mbean || !selectedNode.objectName) {
      return
    }

    setIsReading(true)
    const { objectName } = selectedNode
    const loadJobs = async () => {
      const jobs = await quartzService.loadJobs(objectName)
      setJobs(jobs)
      setIsReading(false)
    }
    loadJobs()

    quartzService.registerJobsLoad(objectName, jobs => {
      setJobs(jobs)
    })

    return () => quartzService.unregisterAll()
  }, [selectedNode])

  useEffect(() => {
    const filteredJobs = quartzService.filterJobs(jobs, filters)
    setFilteredJobs(filteredJobs)
  }, [jobs, filters])

  if (!selectedNode || !selectedNode.mbean || !selectedNode.objectName) {
    return null
  }

  if (isReading) {
    return <HawtioLoadingCard />
  }

  const handleFiltersChange = (target: string, value: string, apply = false) => {
    if (apply || target === 'durability' || target === 'shouldRecover') {
      setFilters(prev => ({ ...prev, [target]: value }))
    } else {
      tempFilters.current = { ...tempFilters.current, [target]: value }
    }
  }

  const onSelect = (target: string) => (_event?: React.MouseEvent<Element, MouseEvent>, value?: string | number) => {
    setFilters(prev => ({ ...prev, [target]: value === 'placeholder' ? '' : value }))
  }

  const applyFilters = () => {
    setFilters(prev => ({ ...prev, ...tempFilters.current }))
  }

  const clearAllFilters = () => {
    setFilters(emptyFilters)
    tempFilters.current = emptyFilters
  }

  const toolbarItemSearchInput = (key: string) => (
    <ToolbarItem key={key} id={`quartz-jobs-table-toolbar-${key}`}>
      <SearchInput
        id={`quartz-jobs-table-toolbar-${key}-input`}
        aria-label={`Filter ${key.charAt(0).toUpperCase() + key.slice(1)}`}
        placeholder={`Filter by ${key}`}
        value={filters[key as keyof JobFilter]}
        onChange={(_, value) => handleFiltersChange(key, value)}
        onSearch={() => applyFilters()}
        onClear={() => handleFiltersChange(key, '', true)}
      />
    </ToolbarItem>
  )

  const tableToolbar = (
    <Toolbar id='quartz-jobs-table-toolbar' clearAllFilters={clearAllFilters}>
      <ToolbarContent>
        <ToolbarGroup id='quartz-jobs-table-toolbar-filters-1'>
          {['group', 'name'].map(key => toolbarItemSearchInput(key))}
          <ToolbarItem id='quartz-jobs-table-toolbar-durable'>
            <Select
              id='quartz-jobs-table-toolbar-durable-select'
              aria-label='Filter Durable'
              selected={filters.durability}
              onOpenChange={setIsSelectDurableOpen}
              isOpen={isSelectDurableOpen}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle ref={toggleRef} onClick={() => setIsSelectDurableOpen(!isSelectDurableOpen)}>
                  Durable
                </MenuToggle>
              )}
              onSelect={onSelect('durability')}
            >
              <SelectList>
                <SelectOption key={0} value='placeholder'>
                  Durable
                </SelectOption>
                <SelectOption key={1} value={'true'}>
                  true
                </SelectOption>
                <SelectOption key={2} value={'false'}>
                  false
                </SelectOption>
              </SelectList>
            </Select>
          </ToolbarItem>
          <ToolbarItem id='quartz-jobs-table-toolbar-recover'>
            <Select
              id='quartz-jobs-table-toolbar-recover-select'
              aria-label='Filter Recover'
              selected={filters.shouldRecover}
              onOpenChange={setIsSelectRecoverOpen}
              isOpen={isSelectRecoverOpen}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle ref={toggleRef} onClick={() => setIsSelectRecoverOpen(!isSelectRecoverOpen)}>
                  Recover
                </MenuToggle>
              )}
              onSelect={onSelect('shouldRecover')}
            >
              <SelectList>
                <SelectOption key={0} value='placeholder'>
                  Recover
                </SelectOption>
                <SelectOption key={1} value={'true'}>
                  true
                </SelectOption>
                <SelectOption key={2} value={'false'}>
                  false
                </SelectOption>
              </SelectList>
            </Select>
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarGroup id='quartz-jobs-table-toolbar-filters-2'>
          {['jobClass', 'description'].map(key => toolbarItemSearchInput(key))}
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
          <Table id='quartz-jobs-table' variant='compact' aria-label='Jobs Table' isStriped isStickyHeader>
            <Thead noWrap>
              <Tr>
                <Th>Group</Th>
                <Th>Name</Th>
                <Th>Durable</Th>
                <Th>Recover</Th>
                <Th>Job Class Name</Th>
                <Th>Description</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredJobs.map((job, index) => (
                <JobsTableRow key={index} job={job} />
              ))}
              {filteredJobs.length === 0 && (
                <Tr>
                  <Td colSpan={6}>{emptyResult}</Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </PanelMainBody>
      </PanelMain>
    </Panel>
  )
}
