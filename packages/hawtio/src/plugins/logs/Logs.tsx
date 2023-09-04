import {
  Bullseye,
  Button,
  Card,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Label,
  PageSection,
  Pagination,
  PaginationProps,
  SearchInput,
  Select,
  SelectOption,
  SelectOptionObject,
  Skeleton,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core'
import { SearchIcon } from '@patternfly/react-icons'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import React, { useEffect, useRef, useState } from 'react'
import { LogEntry } from './log-entry'
import { LOGS_UPDATE_INTERVAL, LogFilter, logsService } from './logs-service'
import { log } from './globals'

export const Logs: React.FunctionComponent = () => {
  return (
    <React.Fragment>
      <PageSection id='logs-header' variant='light'>
        <Title headingLevel='h1'>Logs</Title>
      </PageSection>
      <PageSection id='logs-table' isFilled>
        <LogsTable />
      </PageSection>
    </React.Fragment>
  )
}

const LogsTable: React.FunctionComponent = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const timestamp = useRef(0)
  const [loaded, setLoaded] = useState(false)

  // Filters
  const [isSelectLevelOpen, setIsSelectLevelOpen] = useState(false)
  const [filters, setFilters] = useState<LogFilter>({ level: [], logger: '', message: '', properties: '' })
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])

  // Pagination
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [paginatedLogs, setPaginatedLogs] = useState(filteredLogs.slice(0, perPage))

  useEffect(() => {
    const loadLogs = async () => {
      const result = await logsService.loadLogs()
      setLogs(result.logs)
      timestamp.current = result.timestamp
      setLoaded(true)
      log.debug('Load logs:', timestamp.current)
    }
    loadLogs()

    // Jolokia scheduler cannot be used since we need to update timestamp for the
    // argument to each MBean invocation.
    let timeoutHandle: NodeJS.Timeout
    const updateLogs = async () => {
      log.debug('Update logs:', timestamp.current)
      // Skip initial update
      if (timeoutHandle && timestamp.current > 0) {
        const result = await logsService.loadLogsAfter(timestamp.current)
        if (result.logs.length > 0) {
          setLogs(prev => logsService.append(prev, result.logs))
        }
        timestamp.current = result.timestamp
      }

      timeoutHandle = setTimeout(() => updateLogs(), LOGS_UPDATE_INTERVAL)
    }
    updateLogs()

    return () => timeoutHandle && clearTimeout(timeoutHandle)
  }, [])

  useEffect(() => {
    const filteredLogs = logsService.filter(logs, filters)
    setFilteredLogs(filteredLogs)
  }, [logs, filters])

  useEffect(() => {
    setPaginatedLogs(filteredLogs.slice(0, perPage))
    setPage(1)
  }, [filteredLogs, perPage])

  if (!loaded) {
    return <Skeleton data-testid='loading-logs' screenreaderText='Loading...' />
  }

  const handleFiltersChange = (target: string, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [target]: value }))
  }

  const onLevelSelect = (event: React.MouseEvent | React.ChangeEvent, value: string | SelectOptionObject) => {
    const checked = (event.target as HTMLInputElement).checked
    setFilters(prev => {
      const prevLevels = prev['level']
      const newLevels = checked ? [...prevLevels, value as string] : prevLevels.filter(l => l !== value)
      return { ...prev, level: newLevels }
    })
  }

  const clearAllFilters = () => {
    setFilters({ level: [], logger: '', message: '', properties: '' })
  }

  const handleSetPage = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPage: number,
    _perPage?: number,
    startIdx?: number,
    endIdx?: number,
  ) => {
    setPaginatedLogs(filteredLogs.slice(startIdx, endIdx))
    setPage(newPage)
  }

  const handlePerPageSelect = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPerPage: number,
    newPage: number,
    startIdx?: number,
    endIdx?: number,
  ) => {
    setPaginatedLogs(filteredLogs.slice(startIdx, endIdx))
    setPage(newPage)
    setPerPage(newPerPage)
  }

  const renderPagination = (variant: PaginationProps['variant'], isCompact: boolean) => (
    <Pagination
      isCompact={isCompact}
      itemCount={filteredLogs.length}
      page={page}
      perPage={perPage}
      onSetPage={handleSetPage}
      onPerPageSelect={handlePerPageSelect}
      variant={variant}
      titles={{ paginationTitle: `${variant} pagination` }}
    />
  )

  const logLevels = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR']

  const tableToolbar = (
    <Toolbar id='logs-table-toolbar' clearAllFilters={clearAllFilters} usePageInsets>
      <ToolbarContent>
        <ToolbarGroup id='logs-table-toolbar-filters'>
          <ToolbarFilter
            id='logs-table-toolbar-level'
            chips={filters.level}
            deleteChip={(_, chip) =>
              handleFiltersChange(
                'level',
                filters.level.filter(l => l !== chip),
              )
            }
            deleteChipGroup={_ => handleFiltersChange('level', [])}
            categoryName='Level'
          >
            <Select
              id='logs-table-toolbar-level-select'
              variant='checkbox'
              aria-label='Filter Level'
              placeholderText='Level'
              selections={filters.level}
              isOpen={isSelectLevelOpen}
              onToggle={() => setIsSelectLevelOpen(!isSelectLevelOpen)}
              onSelect={onLevelSelect}
            >
              {logLevels.map((level, index) => (
                <SelectOption key={index} value={level} />
              ))}
            </Select>
          </ToolbarFilter>
          <ToolbarItem id='logs-table-toolbar-logger'>
            <SearchInput
              id='logs-table-toolbar-logger-input'
              aria-label='Filter Logger'
              placeholder='Filter by logger'
              value={filters.logger}
              onChange={(_, value) => handleFiltersChange('logger', value)}
              onClear={() => handleFiltersChange('logger', '')}
            />
          </ToolbarItem>
          <ToolbarItem id='logs-table-toolbar-message'>
            <SearchInput
              id='logs-table-toolbar-message-input'
              aria-label='Filter Message'
              placeholder='Filter by message'
              value={filters.message}
              onChange={(_, value) => handleFiltersChange('message', value)}
              onClear={() => handleFiltersChange('message', '')}
            />
          </ToolbarItem>
          <ToolbarItem id='logs-table-toolbar-properties'>
            <SearchInput
              id='logs-table-toolbar-properties-input'
              aria-label='Filter Properties'
              placeholder='Filter by properties'
              value={filters.properties}
              onChange={(_, value) => handleFiltersChange('properties', value)}
              onClear={() => handleFiltersChange('properties', '')}
            />
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarItem variant='pagination'>{renderPagination('top', true)}</ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  )

  const renderLabel = (level: string) => {
    switch (level) {
      case 'TRACE':
      case 'DEBUG':
        return <Label color='grey'>{level}</Label>
      case 'INFO':
        return <Label color='blue'>{level}</Label>
      case 'WARN':
        return <Label color='orange'>{level}</Label>
      case 'ERROR':
        return <Label color='red'>{level}</Label>
      default:
        return level
    }
  }

  return (
    <Card>
      {tableToolbar}
      <TableComposable variant='compact' aria-label='Logs Table' isStriped isStickyHeader>
        <Thead>
          <Tr>
            <Th>Timestamp</Th>
            <Th>Level</Th>
            <Th>Logger</Th>
            <Th>Message</Th>
          </Tr>
        </Thead>
        <Tbody>
          {paginatedLogs.map((log, index) => (
            <Tr key={index}>
              <Td dataLabel='timestamp'>{log.getTimestamp()}</Td>
              <Td dataLabel='level'>{renderLabel(log.event.level)}</Td>
              <Td dataLabel='logger'>{log.event.logger}</Td>
              <Td dataLabel='message'>{log.event.message}</Td>
            </Tr>
          ))}
          {filteredLogs.length === 0 && (
            <Tr>
              <Td colSpan={4}>
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
              </Td>
            </Tr>
          )}
        </Tbody>
      </TableComposable>
      {renderPagination('bottom', false)}
    </Card>
  )
}
