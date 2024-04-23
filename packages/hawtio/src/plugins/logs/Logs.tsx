import {
  Bullseye,
  Button,
  Card,
  CardBody,
  CardTitle,
  CodeBlock,
  CodeBlockCode,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Label,
  Modal,
  PageSection,
  Pagination,
  PaginationProps,
  Panel,
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
import { log } from './globals'
import { LogEntry, LogFilter } from './log-entry'
import { LOGS_UPDATE_INTERVAL, logsService } from './logs-service'

export const Logs: React.FunctionComponent = () => {
  return (
    <React.Fragment>
      <PageSection id='logs-header' hasShadowBottom variant='light'>
        <Title headingLevel='h1'>Logs</Title>
      </PageSection>
      <Divider />
      <PageSection id='logs-table' variant='light' isFilled>
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
  const emptyFilters: LogFilter = { level: [], logger: '', message: '', properties: '' }
  const [filters, setFilters] = useState(emptyFilters)
  // Temporal filter values holder until applying it
  const tempFilters = useRef<{ logger: string; message: string; properties: string }>(emptyFilters)
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [isSelectLevelOpen, setIsSelectLevelOpen] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [paginatedLogs, setPaginatedLogs] = useState(filteredLogs.slice(0, perPage))

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selected, setSelected] = useState<LogEntry | null>(null)

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

  const handleFiltersChange = (target: string, value: string | string[], apply = false) => {
    if (apply || target === 'level') {
      setFilters(prev => ({ ...prev, [target]: value }))
    } else {
      tempFilters.current = { ...tempFilters.current, [target]: value }
    }
  }

  const onLevelSelect = (event: React.MouseEvent | React.ChangeEvent, value: string | SelectOptionObject) => {
    const checked = (event.target as HTMLInputElement).checked
    setFilters(prev => {
      const prevLevels = prev.level
      const newLevels = checked ? [...prevLevels, value as string] : prevLevels.filter(l => l !== value)
      return { ...prev, level: newLevels }
    })
  }

  const applyFilters = () => {
    setFilters(prev => ({ ...prev, ...tempFilters.current }))
  }

  const clearAllFilters = () => {
    setFilters(emptyFilters)
    tempFilters.current = emptyFilters
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
            deleteChipGroup={() => handleFiltersChange('level', [])}
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
              onSearch={() => applyFilters()}
              onClear={() => handleFiltersChange('logger', '', true)}
            />
          </ToolbarItem>
          <ToolbarItem id='logs-table-toolbar-message'>
            <SearchInput
              id='logs-table-toolbar-message-input'
              aria-label='Filter Message'
              placeholder='Filter by message'
              value={filters.message}
              onChange={(_, value) => handleFiltersChange('message', value)}
              onSearch={() => applyFilters()}
              onClear={() => handleFiltersChange('message', '', true)}
            />
          </ToolbarItem>
          <ToolbarItem id='logs-table-toolbar-properties'>
            <SearchInput
              id='logs-table-toolbar-properties-input'
              aria-label='Filter Properties'
              placeholder='Filter by properties'
              value={filters.properties}
              onChange={(_, value) => handleFiltersChange('properties', value)}
              onSearch={() => applyFilters()}
              onClear={() => handleFiltersChange('properties', '', true)}
            />
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarItem variant='pagination'>{renderPagination('top', true)}</ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  )

  const selectLog = (log: LogEntry) => {
    setSelected(log)
    handleModalToggle()
  }

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen)
  }

  const highlightSearch = (text: string, search: string) => {
    if (search === '') {
      return text
    }
    const lowerCaseSearch = search.toLowerCase()
    const res = text
      .split(new RegExp(`(${search})`, 'gi'))
      .map((s, i) => (s.toLowerCase() === lowerCaseSearch ? <mark key={i}>{s}</mark> : s))
    return res
  }

  return (
    <Panel>
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
            <Tr key={index} onRowClick={() => selectLog(log)}>
              <Td dataLabel='timestamp'>{log.getTimestamp()}</Td>
              <Td dataLabel='level'>
                <LogLevel level={log.event.level} />
              </Td>
              <Td dataLabel='logger'>{highlightSearch(log.event.logger, filters.logger)}</Td>
              <Td dataLabel='message'>{highlightSearch(log.event.message, filters.message)}</Td>
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
      <LogModal isOpen={isModalOpen} onClose={handleModalToggle} log={selected} />
    </Panel>
  )
}

const LogModal: React.FunctionComponent<{
  isOpen: boolean
  onClose: () => void
  log: LogEntry | null
}> = ({ isOpen, onClose, log }) => {
  if (!log) {
    return null
  }

  const { event } = log

  const logDetails = (
    <Card isCompact isPlain>
      <CardBody>
        <DescriptionList isCompact isHorizontal>
          <DescriptionListGroup>
            <DescriptionListTerm>Timestamp</DescriptionListTerm>
            <DescriptionListDescription>{log.getTimestamp()}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Level</DescriptionListTerm>
            <DescriptionListDescription>
              <LogLevel level={event.level} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Logger</DescriptionListTerm>
            <DescriptionListDescription>{event.logger}</DescriptionListDescription>
          </DescriptionListGroup>
          {log.hasLogSourceLineHref && (
            <React.Fragment>
              <DescriptionListGroup>
                <DescriptionListTerm>Class</DescriptionListTerm>
                <DescriptionListDescription>{event.className}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Method</DescriptionListTerm>
                <DescriptionListDescription>{event.methodName}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>File</DescriptionListTerm>
                <DescriptionListDescription>
                  {event.fileName}:{event.lineNumber}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </React.Fragment>
          )}
          {event.host && (
            <DescriptionListGroup>
              <DescriptionListTerm>Host</DescriptionListTerm>
              <DescriptionListDescription>{event.host}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
          <DescriptionListGroup>
            <DescriptionListTerm>Thread</DescriptionListTerm>
            <DescriptionListDescription>{event.thread}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Message</DescriptionListTerm>
            <DescriptionListDescription>
              <CodeBlock>
                <CodeBlockCode>{event.message}</CodeBlockCode>
              </CodeBlock>
            </DescriptionListDescription>
          </DescriptionListGroup>
          {event.exception && (
            <DescriptionListGroup>
              <DescriptionListTerm>Stack Trace</DescriptionListTerm>
              <DescriptionListDescription>{event.exception}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
      </CardBody>
    </Card>
  )

  const osgiProperties = log.hasOSGiProperties && (
    <Card isCompact isPlain>
      <CardTitle>OSGi Properties</CardTitle>
      <CardBody>
        <DescriptionList isCompact isHorizontal>
          {[
            { key: 'bundle.name', name: 'Bundle Name' },
            { key: 'bundle.id', name: 'Bundle ID' },
            { key: 'bundle.version', name: 'Bundle Version' },
          ]
            .filter(({ key }) => event.properties[key] !== undefined)
            .map(({ key, name }) => (
              <DescriptionListGroup key={key}>
                <DescriptionListTerm>${name}</DescriptionListTerm>
                <DescriptionListDescription>{event.properties[key]}</DescriptionListDescription>
              </DescriptionListGroup>
            ))}
        </DescriptionList>
      </CardBody>
    </Card>
  )

  const mdcProperties = log.hasMDCProperties && (
    <Card isCompact isPlain>
      <CardTitle>MDC Properties</CardTitle>
      <CardBody>
        <DescriptionList isCompact isHorizontal>
          {Object.entries(log.mdcProperties).map(([key, value]) => (
            <DescriptionListGroup key={key}>
              <DescriptionListTerm>{key}</DescriptionListTerm>
              <DescriptionListDescription>{value}</DescriptionListDescription>
            </DescriptionListGroup>
          ))}
        </DescriptionList>
      </CardBody>
    </Card>
  )

  return (
    <Modal
      id='logs-log-modal'
      variant='large'
      title='Log'
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        <Button key='close' onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      {logDetails}
      {osgiProperties}
      {mdcProperties}
    </Modal>
  )
}

const LogLevel: React.FunctionComponent<{ level: string }> = ({ level }) => {
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
      return <React.Fragment>{level}</React.Fragment>
  }
}
