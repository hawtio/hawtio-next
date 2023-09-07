import React, { useEffect, useState } from 'react'
import {
  Bullseye,
  Button,
  Card,
  CardBody,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  FormGroup,
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
import { getSystemProperties, SystemProperty } from '@hawtiosrc/plugins/runtime/runtime-service'
import { objectSorter } from '@hawtiosrc/util/objects'

export const SysProps: React.FunctionComponent = () => {
  const [properties, setProperties] = useState<{ key: string; value: string }[]>([])
  const [filteredProperties, setFilteredProperties] = useState<SystemProperty[]>([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<string[]>([])
  const [attributeMenuItem, setAttributeMenuItem] = useState('name')
  const [sortByValue, setSortByValue] = React.useState<boolean>(false)
  const [activeSortDirection, setActiveSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    getSystemProperties().then(props => {
      setProperties(props)
      setFilteredProperties(props)
    })
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
  const handleSearch = (value: string, attribute: string, filters: string[]) => {
    setSearchTerm(value)
    //filter with findTerm
    let filtered: SystemProperty[] = []

    if (value === '') {
      filtered = [...properties]
    } else {
      filtered = properties.filter(prop => {
        return (attribute === 'name' ? prop.key : prop.value).toLowerCase().includes(value.toLowerCase())
      })
    }

    //filter with the rest of the filters
    filters.forEach(value => {
      const attr = value.split(':')[0] ?? ''
      const searchTerm = value.split(':')[1] ?? ''
      filtered = filtered.filter(prop =>
        (attr === 'name' ? prop.key : prop.value).toLowerCase().includes(searchTerm.toLowerCase()),
      )
    })

    setSearchTerm(value)
    setPage(1)
    setFilteredProperties([...filtered])
  }

  const attributes = [
    { key: 'name', value: 'Name' },
    { key: 'value', value: 'Value' },
  ]

  const dropdownItems = attributes.map(a => (
    <DropdownItem
      onClick={() => {
        setAttributeMenuItem(a.key)
        handleSearch(searchTerm, a.key, filters)
      }}
      key={a.key}
    >
      {a.value}
    </DropdownItem>
  ))

  const getSortParams = (sortByValue: boolean): ThProps['sort'] => ({
    sortBy: {
      index: sortByValue ? 1 : 0,
      direction: activeSortDirection,
      defaultDirection: 'asc', // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, index, direction) => {
      setSortByValue(sortByValue)
      setActiveSortDirection(direction)
    },
    columnIndex: sortByValue ? 1 : 0,
  })
  const sortProperties = (): SystemProperty[] => {
    let sortedProps = filteredProperties
    sortedProps = filteredProperties.sort((a, b) => {
      const aValue = sortByValue ? a.value : a.key
      const bValue = sortByValue ? b.value : b.key
      return objectSorter(aValue, bValue, activeSortDirection === 'desc')
    })

    return sortedProps
  }
  return (
    <Card isFullHeight>
      {/*<CardTitle>Browse Messages</CardTitle>*/}
      <CardBody>
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup>
              <Dropdown
                data-testid='attribute-select'
                onSelect={() => setIsDropdownOpen(false)}
                defaultValue='name'
                toggle={
                  <DropdownToggle data-testid='attribute-select-toggle' id='toggle-basic' onToggle={setIsDropdownOpen}>
                    {attributes.find(att => att.key === attributeMenuItem)?.value}
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
            </ToolbarGroup>

            <ToolbarItem variant='pagination'>
              <PropsPagination />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {sortProperties().length > 0 && (
          <FormGroup>
            <TableComposable aria-label='Message Table' variant='compact' height='80vh'>
              <Thead>
                <Tr>
                  <Th sort={getSortParams(false)}>Property Name</Th>
                  <Th sort={getSortParams(true)}>Property Value</Th>
                </Tr>
              </Thead>
              <Tbody>
                {getPageProperties().map((prop, index) => {
                  return (
                    <Tr key={index}>
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
      </CardBody>
    </Card>
  )
}
