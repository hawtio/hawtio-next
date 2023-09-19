import React, { useEffect, useState } from 'react'
import {
  Bullseye,
  Button,
  Card,
  CardBody,
  CodeBlock,
  CodeBlockCode,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  FormGroup,
  Modal,
  ModalVariant,
  Pagination,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core'

import { TableComposable, Tbody, Td, Th, Thead, ThProps, Tr } from '@patternfly/react-table'
import { SearchIcon } from '@patternfly/react-icons'
import { runtimeService } from './runtime-service'
import { objectSorter } from '@hawtiosrc/util/objects'
import { Thread } from '@hawtiosrc/plugins/runtime/types'
import { ThreadInfoModal } from './ThreadInfoModal'

const ThreadsDumpModal: React.FunctionComponent<{
  isOpen: boolean
  setIsOpen: (opened: boolean) => void
}> = ({ isOpen, setIsOpen }) => {
  const [threadsDump, setThreadsDump] = useState<string>('')
  useEffect(() => {
    const readThreadDump = async () => {
      const threadsDump = await runtimeService.dumpThreads()
      setThreadsDump(threadsDump)
    }
    if (isOpen) {
      readThreadDump()
    }
  }, [isOpen])

  return (
    <Modal
      bodyAriaLabel='Thread Dump'
      tabIndex={0}
      isOpen={isOpen}
      variant={ModalVariant.large}
      title='Thread Dump'
      onClose={() => setIsOpen(false)}
    >
      <CodeBlock>
        <CodeBlockCode>{threadsDump}</CodeBlockCode>
      </CodeBlock>
    </Modal>
  )
}

export const Threads: React.FunctionComponent = () => {
  const [threads, setThreads] = useState<Thread[]>([])
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>([])

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<string[]>([])
  const [attributeMenuItem, setAttributeMenuItem] = useState('Name')
  const [sortIndex, setSortIndex] = React.useState<number>(-1)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isThreadsDumpModalOpen, setIsThreadsDumpModalOpen] = useState(false)
  const [isThreadDetailsOpen, setIsThreadDetailsOpen] = useState(false)
  const [currentThread, setCurrentThread] = useState<Thread>()
  const [threadConnectionMonitoring, setThreadConnectionMonitoring] = useState(false)

  useEffect(() => {
    const readThreads = async () => {
      const threads = await runtimeService.loadThreads()
      setThreads(threads)
      setFilteredThreads(threads)
      setThreadConnectionMonitoring(await runtimeService.isThreadContentionMonitoringEnabled())
      await runtimeService.registerLoadThreadsRequest(threads => {
        setThreads(threads)
        setFilteredThreads(threads)
      })
    }
    readThreads()
    return () => runtimeService.unregisterAll()
  }, [])

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
        itemCount={filteredThreads.length}
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

  const getThreadsPage = (): Thread[] => {
    const start = (page - 1) * perPage
    const end = start + perPage
    return filteredThreads.slice(start, end)
  }
  const handleSearch = (value: string, key: string, filters: string[]) => {
    setSearchTerm(value)
    //filter with findTerm
    let filtered: Thread[] = []

    if (value === '') {
      filtered = [...threads]
    } else {
      filtered = threads.filter(thread => {
        return (key === 'Name' ? thread.threadName : String(thread.threadState))
          .toLowerCase()
          .includes(value.toLowerCase())
      })
    }

    //filter with the rest of the filters
    filters.forEach(value => {
      const attr = value.split(':')[0] ?? ''
      const searchTerm = value.split(':')[1] ?? ''
      filtered = filtered.filter(thread =>
        (attr === 'Name' ? thread.threadName : String(thread.threadState))
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      )
    })

    setSearchTerm(value)
    setPage(1)
    setFilteredThreads([...filtered])
  }

  const tableColumns = [
    { key: 'threadId', value: 'ID' },
    { key: 'threadState', value: 'State' },
    { key: 'threadName', value: 'Name' },
    { key: 'waitedTime', value: 'Waited Time' },
    { key: 'blockedTime', value: 'Blocked Time' },
    { key: 'inNative', value: 'Native' },
    { key: 'suspended', value: 'Suspended' },
  ]

  const dropdownItems = [
    <DropdownItem
      onClick={() => {
        setAttributeMenuItem('Name')
        handleSearch(searchTerm, 'Name', filters)
      }}
      key={'name-key'}
    >
      Name
    </DropdownItem>,
    <DropdownItem
      onClick={() => {
        setAttributeMenuItem('State')
        handleSearch(searchTerm, 'State', filters)
      }}
      key={'state'}
    >
      State
    </DropdownItem>,
  ]
  const getIndexedThread = (thread: Thread): (string | number)[] => {
    const { suspended, blockedTime, inNative, threadId, threadName, threadState, waitedTime } = thread
    return [threadId, threadState, threadName, waitedTime, blockedTime, String(inNative), String(suspended)]
  }
  const getSortParams = (sortColumn: number): ThProps['sort'] => ({
    sortBy: {
      index: sortIndex,
      direction: sortDirection,
      defaultDirection: 'asc', // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, index, direction) => {
      setSortIndex(index)
      setSortDirection(direction)
    },
    columnIndex: sortColumn,
  })
  const sortThreads = (): Thread[] => {
    let sortedThreads = filteredThreads
    if (sortIndex >= 0) {
      sortedThreads = filteredThreads.sort((a, b) => {
        const aValue = getIndexedThread(a)[sortIndex]
        const bValue = getIndexedThread(b)[sortIndex]
        return objectSorter(aValue, bValue, sortDirection === 'desc')
      })
    }
    return sortedThreads
  }

  function onThreadDumpClick() {
    setIsThreadsDumpModalOpen(true)
  }

  async function handleConnectionThreadMonitoring() {
    runtimeService.enableThreadContentionMonitoring(!threadConnectionMonitoring)
    setThreadConnectionMonitoring(!threadConnectionMonitoring)
  }

  return (
    <Card isFullHeight>
      <CardBody>
        {isThreadsDumpModalOpen && (
          <ThreadsDumpModal isOpen={isThreadsDumpModalOpen} setIsOpen={setIsThreadsDumpModalOpen} />
        )}
        {isThreadDetailsOpen && currentThread && (
          <ThreadInfoModal isOpen={isThreadDetailsOpen} thread={currentThread} setIsOpen={setIsThreadDetailsOpen} />
        )}
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup>
              <Dropdown
                data-testid='attribute-select'
                onSelect={() => setIsDropdownOpen(false)}
                defaultValue='Name'
                toggle={
                  <DropdownToggle data-testid='attribute-select-toggle' id='toggle-basic' onToggle={setIsDropdownOpen}>
                    {tableColumns.find(att => att.value === attributeMenuItem)?.value}
                  </DropdownToggle>
                }
                isOpen={isDropdownOpen}
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
              <Button variant='secondary' onClick={addToFilters}>
                Add Filter
              </Button>
              <Button variant='secondary' onClick={handleConnectionThreadMonitoring}>
                {threadConnectionMonitoring ? 'Disable' : 'Enable'} Connection Thread Monitoring
              </Button>
              <Button variant='secondary' onClick={onThreadDumpClick}>
                Thread Dump
              </Button>
            </ToolbarGroup>

            <ToolbarItem variant='pagination'>
              <PropsPagination />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
        {sortThreads().length > 0 && (
          <FormGroup>
            <TableComposable aria-label='Message Table' variant='compact' height='80vh' isStriped>
              <Thead>
                <Tr>
                  {tableColumns.map((att, index) => (
                    <Th key={'th-key' + index} data-testid={'id-' + att.key} sort={getSortParams(index)}>
                      {att.value}
                    </Th>
                  ))}
                  <Th> Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {getThreadsPage().map((thread, index) => {
                  return (
                    <Tr key={'row' + index} data-testid={'row' + index}>
                      {tableColumns.map((att, column) => (
                        <Td key={'col' + index + '-' + column}>{getIndexedThread(thread)[column]}</Td>
                      ))}
                      <Td>
                        <Button
                          onClick={_event => {
                            setIsThreadDetailsOpen(true)
                            setCurrentThread(thread)
                          }}
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
        {filteredThreads.length === 0 && (
          <Bullseye>
            <EmptyState>
              <EmptyStateIcon icon={SearchIcon} />
              <EmptyStateBody>No results found.</EmptyStateBody>
            </EmptyState>
          </Bullseye>
        )}
      </CardBody>
    </Card>
  )
}
