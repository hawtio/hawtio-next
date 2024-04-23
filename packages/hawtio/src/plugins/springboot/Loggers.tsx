import React, { useEffect, useState } from 'react'
import {
  Bullseye,
  Button,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  FormGroup,
  Label,
  Pagination,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core'
import { springbootService } from './springboot-service'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { SearchIcon } from '@patternfly/react-icons'
import { Logger } from './types'

const SetLogDropdown: React.FunctionComponent<{
  currentLevel: string
  loggerName: string
  logLevels: string[]
  setIsDropdownOpen: React.Dispatch<React.SetStateAction<string | null>>
  isDropdownOpen: string | null
  reloadLoggers: () => void
}> = ({ currentLevel, loggerName, logLevels, setIsDropdownOpen, isDropdownOpen, reloadLoggers }) => {
  const items = logLevels.map(level => (
    <DropdownItem
      key={loggerName + '' + level}
      onClick={() => {
        springbootService.configureLogLevel(loggerName, level)
        reloadLoggers()
      }}
    >
      <LogLevel level={level} />
    </DropdownItem>
  ))

  return (
    <Dropdown
      isPlain
      onSelect={() => setIsDropdownOpen(null)}
      defaultValue={currentLevel}
      toggle={
        <DropdownToggle
          id={`toggle-basic-${loggerName}`}
          onToggle={() => setIsDropdownOpen(prevState => (prevState === loggerName ? null : loggerName))}
        >
          <LogLevel level={currentLevel} />
        </DropdownToggle>
      }
      isOpen={isDropdownOpen === loggerName}
      dropdownItems={items}
    />
  )
}
const LogLevel: React.FunctionComponent<{ level: string }> = ({ level }) => {
  switch (level) {
    case 'TRACE':
    case 'OFF':
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
export const Loggers: React.FunctionComponent = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const [filters, setFilters] = useState<string[]>([])
  const [logLevel, setLogLevel] = useState<string>('ALL')
  const [filteredLoggers, setFilteredLoggers] = useState<Logger[]>([])
  const [loggers, setLoggers] = useState<Logger[]>([])
  const [logLevels, setLogLevels] = useState<string[]>([])
  const [isLogLevelDropdownOpen, setIsLogLevelDropdownOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [reloadLoggers, setReloadLoggers] = useState(false)

  useEffect(() => {
    springbootService.getLoggerConfiguration().then(logConf => {
      const sorted = logConf.loggers.sort((logger1, logger2) => {
        if (logger1.name === 'ROOT') return -1
        else if (logger2.name === 'ROOT') return 1
        else return logger1.name.localeCompare(logger2.name)
      })
      setLoggers(sorted)
      setLogLevels([...logConf.levels])
      setFilteredLoggers(sorted)
    })
  }, [reloadLoggers])

  useEffect(() => {
    let filtered: Logger[] = loggers.filter(logger => logLevel === 'ALL' || logger.configuredLevel === logLevel)

    //filter with the rest of the filters
    ;[...filters, searchTerm].forEach(value => {
      filtered = filtered.filter(prop => prop.name.toLowerCase().includes(value.toLowerCase()))
    })
    setFilteredLoggers([...filtered])
    setPage(1)
  }, [filters, searchTerm, logLevel, loggers])

  const onDeleteFilter = (filter: string) => {
    const newFilters = filters.filter(f => f !== filter)
    setFilters(newFilters)
  }
  const addToFilters = () => {
    setFilters([...filters, searchTerm])
    setSearchTerm('')
  }
  const clearFilters = () => {
    setFilters([])
    setSearchTerm('')
  }

  const PropsPagination = () => {
    return (
      <Pagination
        itemCount={filteredLoggers.length}
        page={page}
        perPage={perPage}
        onSetPage={(_evt, value) => setPage(value)}
        onPerPageSelect={(_evt, value) => {
          setPerPage(value)
          setPage(1)
        }}
        variant='top'
      />
    )
  }
  const getCurrentPage = (): Logger[] => {
    const start = (page - 1) * perPage
    const end = start + perPage
    return filteredLoggers.slice(start, end)
  }

  const dropdownItems = ['ALL', ...logLevels].map(level => (
    <DropdownItem
      onClick={() => {
        setLogLevel(level)
      }}
      key={level}
    >
      <LogLevel level={level} />
    </DropdownItem>
  ))

  const tableToolbar = (
    <Toolbar>
      <ToolbarContent>
        <ToolbarGroup>
          <Dropdown
            data-testid='attribute-select'
            onSelect={() => setIsLogLevelDropdownOpen(false)}
            defaultValue='INFO'
            toggle={
              <DropdownToggle
                data-testid='attribute-select-toggle'
                id='toggle-basic'
                onToggle={setIsLogLevelDropdownOpen}
              >
                <LogLevel level={logLevel} />
              </DropdownToggle>
            }
            isOpen={isLogLevelDropdownOpen}
            dropdownItems={dropdownItems}
          />
          <ToolbarFilter
            chips={filters}
            deleteChip={(_e, filter) => onDeleteFilter(filter as string)}
            deleteChipGroup={clearFilters}
            categoryName='Filters'
          >
            <SearchInput
              type='text'
              data-testid='filter-input'
              id='search-input'
              placeholder='Search...'
              value={searchTerm}
              onChange={(_event, value) => setSearchTerm(value)}
              aria-label='Search input'
            />
          </ToolbarFilter>
          <Button variant='secondary' onClick={addToFilters} isSmall>
            Add Filter
          </Button>
        </ToolbarGroup>

        <ToolbarItem variant='pagination'>
          <PropsPagination />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  )

  return (
    <React.Fragment>
      {tableToolbar}
      {getCurrentPage().length > 0 && (
        <FormGroup>
          <TableComposable aria-label='Message Table' variant='compact' height='80vh' isStriped isStickyHeader>
            <Thead>
              <Tr>
                <Th data-testid={'log-level-header'}>Log Level</Th>
                <Th data-testid={'logger-name-header'}>Logger Name</Th>
              </Tr>
            </Thead>
            <Tbody>
              {getCurrentPage().map((logger, index) => {
                return (
                  <Tr key={'row' + index} data-testid={'row' + index}>
                    <Td style={{ width: '20%' }}>
                      <SetLogDropdown
                        loggerName={logger.name}
                        currentLevel={logger.configuredLevel}
                        logLevels={logLevels}
                        setIsDropdownOpen={setIsDropdownOpen}
                        isDropdownOpen={isDropdownOpen}
                        reloadLoggers={() => {
                          setReloadLoggers(!reloadLoggers)
                        }}
                      />
                    </Td>
                    <Td style={{ flex: 3 }}>{logger.name}</Td>
                  </Tr>
                )
              })}
            </Tbody>
          </TableComposable>
        </FormGroup>
      )}
      {filteredLoggers.length === 0 && (
        <Bullseye>
          <EmptyState>
            <EmptyStateIcon icon={SearchIcon} />
            <EmptyStateBody>No results found.</EmptyStateBody>
          </EmptyState>
        </Bullseye>
      )}
    </React.Fragment>
  )
}
