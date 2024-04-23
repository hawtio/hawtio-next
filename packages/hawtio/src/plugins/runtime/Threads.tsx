import {
  Bullseye,
  Button,
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
  Pagination,
  Panel,
  PanelHeader,
  PanelMain,
  PanelMainBody,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core'
import React, { useEffect, useState } from 'react'

import { Thread } from './types'
import { objectSorter } from '@hawtiosrc/util/objects'
import { SearchIcon } from '@patternfly/react-icons'
import { TableComposable, Tbody, Td, Th, Thead, ThProps, Tr } from '@patternfly/react-table'
import { runtimeService } from './runtime-service'
import { ThreadInfoModal, ThreadState } from './ThreadInfoModal'

const ThreadsDumpModal: React.FunctionComponent<{
  isOpen: boolean
  setIsOpen: (opened: boolean) => void
}> = ({ isOpen, setIsOpen }) => {
  const [threadsDump, setThreadsDump] = useState('')

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
      variant='large'
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
      runtimeService.registerLoadThreadsRequest(threads => {
        setThreads(threads)
        setFilteredThreads(threads)
      })
    }
    readThreads()
    return () => runtimeService.unregisterAll()
  }, [])

  useEffect(() => {
    let filtered: Thread[] = [...threads]

    //add current searchTerm and filter
    ;[...filters, `${attributeMenuItem}:${searchTerm}`].forEach(value => {
      const attr = value.split(':')[0] ?? ''
      const searchTerm = value.split(':')[1] ?? ''
      filtered = filtered.filter(thread =>
        (attr === 'Name' ? thread.threadName : String(thread.threadState))
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      )
    })

    setPage(1)
    setFilteredThreads([...filtered])
  }, [threads, searchTerm, attributeMenuItem, filters])

  const onDeleteFilter = (filter: string) => {
    if (`${attributeMenuItem}:${searchTerm}` === filter) {
      setSearchTerm('')
    } else {
      const newFilters = filters.filter(f => f !== filter)
      setFilters(newFilters)
    }
  }

  const addToFilters = () => {
    if (searchTerm !== '') {
      setFilters([...filters, `${attributeMenuItem}:${searchTerm}`])
      setSearchTerm('')
    }
  }

  const clearFilters = () => {
    setFilters([])
    setSearchTerm('')
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
      }}
      key={'name-key'}
    >
      Name
    </DropdownItem>,
    <DropdownItem
      onClick={() => {
        setAttributeMenuItem('State')
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

  const onThreadDumpClick = () => {
    setIsThreadsDumpModalOpen(true)
  }

  const handleConnectionThreadMonitoring = async () => {
    await runtimeService.enableThreadContentionMonitoring(!threadConnectionMonitoring)
    setThreadConnectionMonitoring(!threadConnectionMonitoring)
  }

  const tableToolbar = (
    <Toolbar clearAllFilters={clearFilters}>
      <ToolbarContent>
        <ToolbarGroup>
          <Dropdown
            data-testid='attribute-select'
            onSelect={() => {
              setIsDropdownOpen(false)
              addToFilters()
            }}
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
            chips={searchTerm !== '' ? [...filters, `${attributeMenuItem}:${searchTerm}`] : filters}
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
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarItem>
            <Button variant='primary' onClick={handleConnectionThreadMonitoring} isSmall>
              {threadConnectionMonitoring ? 'Disable' : 'Enable'} connection thread monitoring
            </Button>
          </ToolbarItem>
          <ToolbarItem>
            <Button variant='secondary' onClick={onThreadDumpClick} isSmall>
              Thread dump
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
    <Panel>
      <ThreadsDumpModal isOpen={isThreadsDumpModalOpen} setIsOpen={setIsThreadsDumpModalOpen} />
      <ThreadInfoModal isOpen={isThreadDetailsOpen} thread={currentThread} setIsOpen={setIsThreadDetailsOpen} />
      <PanelHeader>{tableToolbar}</PanelHeader>
      <PanelMain>
        <PanelMainBody>
          {sortThreads().length > 0 && (
            <FormGroup>
              <TableComposable aria-label='Message Table' variant='compact' height='80vh' isStriped isStickyHeader>
                <Thead>
                  <Tr>
                    {tableColumns.map((att, index) => (
                      <Th key={'th-key' + index} data-testid={'id-' + att.key} sort={getSortParams(index)}>
                        {att.value}
                      </Th>
                    ))}
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {getThreadsPage().map((thread, index) => {
                    return (
                      <Tr key={'row' + index} data-testid={'row' + index}>
                        {tableColumns.map((att, column) => (
                          <Td key={'col' + index + '-' + column}>
                            {att.key === 'threadState' ? (
                              <ThreadState state={getIndexedThread(thread)[column] as string} />
                            ) : (
                              getIndexedThread(thread)[column]
                            )}
                          </Td>
                        ))}
                        <Td>
                          <Button
                            onClick={_event => {
                              setIsThreadDetailsOpen(true)
                              setCurrentThread(thread)
                            }}
                            isSmall
                            variant='link'
                          >
                            Details
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
        </PanelMainBody>
      </PanelMain>
    </Panel>
  )
}
