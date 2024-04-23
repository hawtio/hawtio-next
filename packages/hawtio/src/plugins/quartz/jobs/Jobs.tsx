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
  Select,
  SelectOption,
  SelectOptionObject,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core'
import { SearchIcon } from '@patternfly/react-icons'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
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

  const onSelect =
    (target: string) =>
    (_event: React.MouseEvent | React.ChangeEvent, value: string | SelectOptionObject, isPlaceHolder?: boolean) => {
      setFilters(prev => ({ ...prev, [target]: isPlaceHolder ? '' : value }))
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
              variant='single'
              aria-label='Filter Durable'
              selections={filters.durability}
              isOpen={isSelectDurableOpen}
              onToggle={() => setIsSelectDurableOpen(!isSelectDurableOpen)}
              onSelect={onSelect('durability')}
            >
              {[
                <SelectOption key={0} value='Durable' isPlaceholder />,
                ...['true', 'false'].map((state, index) => <SelectOption key={index + 1} value={state} />),
              ]}
            </Select>
          </ToolbarItem>
          <ToolbarItem id='quartz-jobs-table-toolbar-recover'>
            <Select
              id='quartz-jobs-table-toolbar-recover-select'
              variant='single'
              aria-label='Filter Recover'
              selections={filters.shouldRecover}
              isOpen={isSelectRecoverOpen}
              onToggle={() => setIsSelectRecoverOpen(!isSelectRecoverOpen)}
              onSelect={onSelect('shouldRecover')}
            >
              {[
                <SelectOption key={0} value='Recover' isPlaceholder />,
                ...['true', 'false'].map((state, index) => <SelectOption key={index + 1} value={state} />),
              ]}
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
      <EmptyState variant='small'>
        <EmptyStateIcon icon={SearchIcon} />
        <Title headingLevel='h2' size='lg'>
          No results found
        </Title>
        <EmptyStateBody>Clear all filters and try again.</EmptyStateBody>
        <Button variant='link' onClick={clearAllFilters}>
          Clear all filters
        </Button>
      </EmptyState>
    </Bullseye>
  )

  return (
    <Panel>
      <PanelMain>
        <PanelMainBody>
          {tableToolbar}
          <TableComposable id='quartz-jobs-table' variant='compact' aria-label='Jobs Table' isStriped isStickyHeader>
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
          </TableComposable>
        </PanelMainBody>
      </PanelMain>
    </Panel>
  )
}
