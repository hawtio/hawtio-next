import { objectSorter } from '@hawtiosrc/util/objects'
import {
  Bullseye,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  FormGroup,
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
import { SearchIcon } from '@patternfly/react-icons'
import { TableComposable, Tbody, Td, Th, ThProps, Thead, Tr } from '@patternfly/react-table'
import React, { useEffect, useState } from 'react'
import { runtimeService } from './runtime-service'
import { SystemProperty } from './types'

export const SysProps: React.FunctionComponent = () => {
  const [properties, setProperties] = useState<{ key: string; value: string }[]>([])
  const [filteredProperties, setFilteredProperties] = useState<SystemProperty[]>([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<string[]>([])
  const [filteredAttribute, setFilteredAttribute] = useState('name')
  const [sortIndex, setSortIndex] = React.useState<number>(-1)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    runtimeService.loadSystemProperties().then(props => {
      setProperties(props)
      setFilteredProperties(props)
    })
  }, [])

  useEffect(() => {
    //filter with findTerm
    let filtered: SystemProperty[] = [...properties]

    //add current search word to filters and filter
    ;[...filters, `${filteredAttribute}:${searchTerm}`].forEach(value => {
      const attr = value.split(':')[0] ?? ''
      const searchTerm = value.split(':')[1] ?? ''
      filtered = filtered.filter(prop =>
        (attr === 'name' ? prop.key : prop.value).toLowerCase().includes(searchTerm.toLowerCase()),
      )
    })

    setPage(1)
    setFilteredProperties([...filtered])
  }, [searchTerm, properties, filters, filteredAttribute])

  const onDeleteFilter = (filter: string) => {
    if (`${filteredAttribute}:${searchTerm}` === filter) {
      setSearchTerm('')
    } else {
      const newFilters = filters.filter(f => f !== filter)
      setFilters(newFilters)
    }
  }

  const addToFilters = () => {
    if (searchTerm !== '') {
      setFilters([...filters, `${filteredAttribute}:${searchTerm}`])
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
        itemCount={filteredProperties.length}
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

  const getPageProperties = (): SystemProperty[] => {
    const start = (page - 1) * perPage
    const end = start + perPage
    return filteredProperties.slice(start, end)
  }

  const attributes = [
    { key: 'name', value: 'Name' },
    { key: 'value', value: 'Value' },
  ]

  const dropdownItems = attributes.map(a => (
    <DropdownItem
      onClick={() => {
        setFilteredAttribute(a.key)
      }}
      key={a.key}
    >
      {a.value}
    </DropdownItem>
  ))

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

  const sortProperties = (): SystemProperty[] => {
    let sortedProps = filteredProperties
    if (sortIndex >= 0) {
      sortedProps = filteredProperties.sort((a, b) => {
        const aValue = sortIndex === 1 ? a.value : a.key
        const bValue = sortIndex === 1 ? b.value : b.key
        return objectSorter(aValue, bValue, sortDirection === 'desc')
      })
    }

    return sortedProps
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
            defaultValue='name'
            toggle={
              <DropdownToggle data-testid='attribute-select-toggle' id='toggle-basic' onToggle={setIsDropdownOpen}>
                {attributes.find(att => att.key === filteredAttribute)?.value}
              </DropdownToggle>
            }
            isOpen={isDropdownOpen}
            dropdownItems={dropdownItems}
          />
          <ToolbarFilter
            chips={searchTerm !== '' ? [...filters, `${filteredAttribute}:${searchTerm}`] : filters}
            deleteChip={(_e, filter) => onDeleteFilter(filter as string)}
            deleteChipGroup={clearFilters}
            categoryName='Filters'
          >
            <SearchInput
              type='text'
              data-testid='filter-input'
              id='search-input'
              placeholder={'Filter by ' + filteredAttribute}
              value={searchTerm}
              onChange={(_event, value) => setSearchTerm(value)}
              aria-label='Search input'
            />
          </ToolbarFilter>
        </ToolbarGroup>

        <ToolbarItem variant='pagination'>
          <PropsPagination />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  )

  return (
    <Panel>
      <PanelHeader>{tableToolbar}</PanelHeader>
      <PanelMain>
        <PanelMainBody>
          {sortProperties().length > 0 && (
            <FormGroup>
              <TableComposable aria-label='Message Table' variant='compact' height='80vh' isStriped isStickyHeader>
                <Thead>
                  <Tr>
                    <Th data-testid={'name-header'} sort={getSortParams(0)}>
                      Property Name
                    </Th>
                    <Th data-testid={'value-header'} sort={getSortParams(1)}>
                      Property Value
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {getPageProperties().map((prop, index) => {
                    return (
                      <Tr key={'row' + index} data-testid={'row' + index}>
                        <Td style={{ width: '20%' }}>{prop.key}</Td>
                        <Td style={{ flex: 3 }}>{prop.value}</Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </TableComposable>
            </FormGroup>
          )}
          {filteredProperties.length === 0 && (
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
