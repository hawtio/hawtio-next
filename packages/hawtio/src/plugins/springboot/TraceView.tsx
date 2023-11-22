import React, { useState } from 'react'
import {
  Bullseye,
  Button,
  Card,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Flex,
  FormGroup,
  Label,
  PageSection,
  Pagination,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core'
import { TableComposable, Tbody, Td, Th, Thead, ThProps, Tr } from '@patternfly/react-table'
import { CheckCircleIcon, ExclamationCircleIcon, SearchIcon } from '@patternfly/react-icons'
import { Trace } from '@hawtiosrc/plugins/springboot/types'

const HttpStatusIcon: React.FunctionComponent<{ code: number }> = ({ code }) => {
  if (code < 400) return <CheckCircleIcon color={'#3E8635'} />
  else return <ExclamationCircleIcon color={'#C9190B'} />
}

const HttpMethodLabel: React.FunctionComponent<{ level: string }> = ({ level }) => {
  switch (level) {
    case 'GET':
    case 'HEAD':
      return <Label color='blue'>{level}</Label>
    case 'POST':
      return <Label color='orange'>{level}</Label>
    case 'DELETE':
      return <Label color='red'>{level}</Label>
    case 'PUT':
    case 'PATCH':
      return <Label color='green'>{level}</Label>
    default:
      return <Label color='grey'>{level}</Label>
  }
}
export const TraceView: React.FunctionComponent = () => {
  const [traces, setTraces] = useState<Trace[]>([
    { timestamp: 1000, httpStatusCode: 200, method: 'GET', path: '/', timeTaken: 123213 },
    { timestamp: 1000, httpStatusCode: 200, method: 'GET', path: '/', timeTaken: 123213 },
    { timestamp: 1000, httpStatusCode: 200, method: 'GET', path: '/', timeTaken: 123213 },
    { timestamp: 1000, httpStatusCode: 200, method: 'GET', path: '/', timeTaken: 123213 },
    { timestamp: 1000, httpStatusCode: 400, method: 'GET', path: '/', timeTaken: 123213 },
    { timestamp: 1000, httpStatusCode: 500, method: 'GET', path: '/', timeTaken: 123213 },
    { timestamp: 1000, httpStatusCode: 500, method: 'GET', path: '/', timeTaken: 123213 },
    { timestamp: 1000, httpStatusCode: 200, method: 'GET', path: '/', timeTaken: 123213 },
    { timestamp: 1000, httpStatusCode: 200, method: 'GET', path: '/', timeTaken: 123213 },
  ])
  const [filteredTraces, setFilteredTraces] = useState<Trace[]>([
    { timestamp: 1000, httpStatusCode: 200, method: 'GET', path: '/', timeTaken: 123213 },
    { timestamp: 1000, httpStatusCode: 200, method: 'GET', path: '/', timeTaken: 123213 },
    { timestamp: 1000, httpStatusCode: 200, method: 'GET', path: '/', timeTaken: 123213 },
    { timestamp: 1000, httpStatusCode: 200, method: 'GET', path: '/', timeTaken: 123213 },
    { timestamp: 1000, httpStatusCode: 400, method: 'GET', path: '/', timeTaken: 123213 },
    { timestamp: 1000, httpStatusCode: 500, method: 'GET', path: '/', timeTaken: 123213 },
    { timestamp: 1000, httpStatusCode: 500, method: 'GET', path: '/', timeTaken: 123213 },
    { timestamp: 1000, httpStatusCode: 200, method: 'GET', path: '/', timeTaken: 123213 },
    { timestamp: 1000, httpStatusCode: 200, method: 'GET', path: '/', timeTaken: 123213 },
  ])

  const [httpMethodFilter, setMethodFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<string[]>([])
  const [attributeMenuItem, setAttributeMenuItem] = useState('HTTP Method')
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
  const [isHttpMethodFilterDropdownOpen, setIsHttpMethodFilterDropdownOpen] = useState(false)
  // const [isTraceDetailsOpen, setIsTraceDetailsOpen] = useState(false)
  //const [currentThread, setCurrentThread] = useState<Thread>()

  const onDeleteFilter = (filter: string) => {
    const newFilters = filters.filter(f => f !== filter)
    setFilters(newFilters)
    handleSearch(searchTerm, attributeMenuItem, newFilters)
  }

  const addToFilters = () => {
    setFilters([...filters, `${attributeMenuItem}:${searchTerm}`])
    setSearchTerm('')
  }

  const clearFilters = () => {
    setFilters([])
    setSearchTerm('')
    handleSearch('', attributeMenuItem, [])
  }

  const PropsPagination = () => {
    return (
      <Pagination
        itemCount={filteredTraces.length}
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

  const getTablePage = (): Trace[] => {
    const start = (page - 1) * perPage
    const end = start + perPage
    return filteredTraces.slice(start, end)
  }

  const handleSearch = (value: string, key: string, filters: string[]) => {
    setSearchTerm(value)
    //filter with findTerm
    let filtered: Trace[] = []

    if (value === '') {
      filtered = [...traces]
    } else {
      filtered = traces.filter(trace => {
        return trace.method.toLowerCase().includes(httpMethodFilter.toLowerCase())
      })
    }

    //filter with the rest of the filters
    filters.forEach(value => {
      const attr = value.split(':')[0] ?? ''
      const searchTerm = value.split(':')[1] ?? ''
      switch (attr) {
        case 'timestamp':
          filtered = filtered.filter(trace => trace.timestamp === searchTerm)
          break
        case 'status':
          filtered = filtered.filter(trace => parseInt(searchTerm) === trace.httpStatusCode)
          break
        case 'path':
          filtered = filtered.filter(trace => trace.path === searchTerm)
          break
        case 'timeTaken':
          filtered = filtered.filter(trace => parseInt(searchTerm) === trace.timeTaken)
          break
      }
    })

    setSearchTerm(value)
    setPage(1)
    setFilteredTraces([...filtered])
  }

  const tableColumns = [
    { key: 'timestamp', value: 'Timestamp' },
    { key: 'httpStatus', value: 'HTTP Status' },
    { key: 'httpMethod', value: 'HTTP Method' },
    { key: 'path', value: 'Path' },
    { key: 'timeTaken', value: 'Time Taken' },
  ]

  const dropdownItems = tableColumns.map(col => (
    <DropdownItem
      onClick={() => {
        setAttributeMenuItem(col.value)
        handleSearch(searchTerm, col.value, filters)
      }}
      key={col.key}
    >
      {col.value}
    </DropdownItem>
  ))

  const httpMethodsDropdownItems = ['ALL', 'GET', 'POST', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH', 'PUT', 'TRACE'].map(
    method => <DropdownItem onClick={() => setMethodFilter(method)} key={'method-' + method}></DropdownItem>,
  )

  const onShowTraceDetailClick = () => {
    //  setIsTraceDetailsOpen(true)
  }

  const TableToolbar: React.FunctionComponent = () => (
    <Toolbar>
      <ToolbarContent>
        <ToolbarItem>
          <Dropdown
            data-testid='http-method-select'
            onSelect={() => setIsHttpMethodFilterDropdownOpen(false)}
            toggle={
              <DropdownToggle
                data-testid='attribute-select-toggle'
                id='toggle-basic'
                onToggle={setIsHttpMethodFilterDropdownOpen}
              >
                {httpMethodFilter}
              </DropdownToggle>
            }
            isOpen={isHttpMethodFilterDropdownOpen}
            dropdownItems={httpMethodsDropdownItems}
          />
        </ToolbarItem>
        <ToolbarGroup>
          <Dropdown
            data-testid='attribute-select'
            onSelect={() => setIsFilterDropdownOpen(false)}
            defaultValue='HTTP Method'
            toggle={
              <DropdownToggle
                data-testid='attribute-select-toggle'
                id='toggle-basic'
                onToggle={setIsFilterDropdownOpen}
              >
                {tableColumns.find(att => att.value === attributeMenuItem)?.value}
              </DropdownToggle>
            }
            isOpen={isFilterDropdownOpen}
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
              onChange={(_event, value) => handleSearch(value, attributeMenuItem, filters)}
              aria-label='Search input'
            />
          </ToolbarFilter>
          <ToolbarItem>
            <Button variant='secondary' onClick={addToFilters} isSmall>
              Add Filter
            </Button>
          </ToolbarItem>
        </ToolbarGroup>

        <ToolbarItem variant='pagination'>
          <PropsPagination />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  )

  return (
    <PageSection>
      <Card isFullHeight>
        {/*<ThreadsDumpModal isOpen={isThreadsDumpModalOpen} setIsOpen={setIsThreadsDumpModalOpen} />*/}
        {/*<ThreadInfoModal isOpen={isThreadDetailsOpen} thread={currentThread} setIsOpen={setIsThreadDetailsOpen} />*/}
        <TableToolbar />
        {getTablePage().length > 0 && (
          <FormGroup>
            <TableComposable aria-label='Message Table' variant='compact' height='80vh' isStriped isStickyHeader>
              <Thead>
                <Tr>
                  {tableColumns.map((att, index) => (
                    <Th key={'th-key' + index} data-testid={'id-' + att.key}>
                      {att.value}
                    </Th>
                  ))}
                  <Th> Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {getTablePage().map((trace, index) => {
                  return (
                    <Tr key={'row' + index} data-testid={'row' + index}>
                      <Td key={'col-timestamp'}>{trace.timestamp}</Td>
                      <Td key={'col-http-status'}>
                        <Flex>
                          <HttpStatusIcon code={trace.httpStatusCode} />
                          <span>{trace.httpStatusCode}</span>
                        </Flex>
                      </Td>
                      <Td key={'col-http=method'}>
                        <HttpMethodLabel level={trace.method} />
                      </Td>
                      <Td key={'col-path'}>{trace.path}</Td>
                      <Td key={'col-time-taken'}>{trace.timeTaken}</Td>
                      <Td>
                        <Button
                          onClick={_event => {
                            setIsTraceDetailsOpen(true)
                            setCurrentThread(trace)
                          }}
                          isSmall
                        >
                          More
                        </Button>
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </TableComposable>
          </FormGroup>
        )}
        {filteredTraces.length === 0 && (
          <Bullseye>
            <EmptyState>
              <EmptyStateIcon icon={SearchIcon} />
              <EmptyStateBody>No results found.</EmptyStateBody>
            </EmptyState>
          </Bullseye>
        )}
      </Card>
    </PageSection>
  )
}
