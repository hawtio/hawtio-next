import React, { useContext, useEffect, useState } from 'react'
import { CamelContext } from '@hawtiosrc/plugins/camel/context'
import { EndpointStatistics, getEndpointStatistics } from '@hawtiosrc/plugins/camel/endpoints/endpoints-service'
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
  PageSection,
  SearchInput,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
} from '@patternfly/react-core'
import { TableComposable, Tbody, Td, Th, Thead, ThProps, Tr } from '@patternfly/react-table'
import { SearchIcon } from '@patternfly/react-icons'
import { objectSorter } from '@hawtiosrc/util/objects'

export const EndpointStats: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const [stats, setStats] = useState<EndpointStatistics[]>([])
  const [filteredStats, setFilteredStats] = useState<EndpointStatistics[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filters, setFilters] = useState<string[]>([])
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(-1)
  const [activeSortDirection, setActiveSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [attributeMenuItem, setAttributeMenuItem] = useState('url')
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)

  useEffect(() => {
    if (selectedNode) {
      getEndpointStatistics(selectedNode).then(st => {
        setStats(st)
        setFilteredStats(st)
      })
    }
  }, [selectedNode])

  const clearFilters = () => {
    setFilters([])
    setSearchTerm('')
    handleSearch('', attributeMenuItem, [])
  }

  const handleSearch = (value: string, attribute: string, filters: string[]) => {
    setSearchTerm(value)
    //filter with findTerm
    let filtered: EndpointStatistics[] = []
    if (value === '') {
      filtered = [...stats]
    } else {
      filtered = stats.filter(stat => (stat[attribute] as string).toLowerCase().includes(value.toLowerCase()))
    }

    //filter with the rest of the filters
    filters.forEach(value => {
      const attr = value.split(':')[0] ?? ''
      const searchTerm = value.split(':')[1] ?? ''
      filtered = filtered.filter(stat => String(stat[attr]).toLowerCase().includes(searchTerm.toLowerCase()))
    })

    setSearchTerm(value)
    setFilteredStats([...filtered])
  }

  const onDeleteFilter = (filter: string) => {
    const newFilters = filters.filter(f => f !== filter)
    setFilters(newFilters)
    handleSearch(searchTerm, attributeMenuItem, newFilters)
  }

  const addToFilters = () => {
    setFilters([...filters, `${attributeMenuItem}:${searchTerm}`])
    setSearchTerm('')
  }
  const getSortableStats = (stat: EndpointStatistics): (number | string)[] => {
    const { hits, routeId, dynamic, url, direction } = stat

    return [url, routeId, direction, String(stat.static), String(dynamic), hits]
  }
  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
      defaultDirection: 'asc', // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index)
      setActiveSortDirection(direction)
    },
    columnIndex,
  })

  const attributes = [
    { key: 'url', value: 'URL' },
    { key: 'routeId', value: 'Route ID' },
    { key: 'direction', value: 'Direction' },
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
  const sortStatistics = (): EndpointStatistics[] => {
    let sortedStats = filteredStats
    if (activeSortIndex >= 0) {
      sortedStats = filteredStats.sort((a, b) => {
        const aValue = getSortableStats(a)[activeSortIndex]
        const bValue = getSortableStats(b)[activeSortIndex]
        return objectSorter(aValue, bValue, activeSortDirection === 'desc')
      })
    }
    return sortedStats
  }

  return (
    <PageSection variant='light'>
      <Title headingLevel='h1'>Endpoints (in/out)</Title>

      <Toolbar clearAllFilters={clearFilters}>
        <ToolbarContent>
          <ToolbarGroup>
            <Dropdown
              data-testid='attribute-select'
              onSelect={() => setIsDropdownOpen(false)}
              defaultValue='url'
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
                onChange={(_event, value) => {
                  handleSearch(value, attributeMenuItem, filters)
                }}
                aria-label='Search input'
              />
            </ToolbarFilter>
            <Button onClick={addToFilters}>Add Filter</Button>
          </ToolbarGroup>
        </ToolbarContent>
      </Toolbar>

      {sortStatistics().length > 0 ? (
        <FormGroup>
          <TableComposable aria-label='Endpoints Table' variant='compact' height='80vh'>
            <Thead>
              <Tr>
                <Th data-testid={'url-header'} sort={getSortParams(0)}>
                  URL
                </Th>
                <Th data-testid={'routeId-header'} sort={getSortParams(1)}>
                  Route ID
                </Th>
                <Th data-testid={'direction-header'} sort={getSortParams(2)}>
                  Direction
                </Th>
                <Th data-testid={'static-header'} sort={getSortParams(3)}>
                  Static
                </Th>
                <Th data-testid={'dynamic-header'} sort={getSortParams(4)}>
                  Dynamic
                </Th>
                <Th data-testid={'hits-header'} sort={getSortParams(5)}>
                  Hits
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredStats.map((stat: EndpointStatistics, index) => {
                return (
                  <Tr key={'row' + index} data-testid={'row' + index}>
                    <Td style={{ flex: 3 }}>{stat.url}</Td>
                    <Td style={{ width: '20%' }}>{stat.routeId}</Td>
                    <Td style={{ flex: 1 }}>{stat.direction}</Td>
                    <Td style={{ flex: 1 }}>{stat.static + ''}</Td>
                    <Td style={{ flex: 1 }}>{stat.dynamic + ''}</Td>
                    <Td style={{ flex: 1 }}>{stat.hits}</Td>
                  </Tr>
                )
              })}
            </Tbody>
          </TableComposable>
        </FormGroup>
      ) : (
        <Bullseye>
          <EmptyState>
            <EmptyStateIcon icon={SearchIcon} />
            <EmptyStateBody>No results found.</EmptyStateBody>
          </EmptyState>
        </Bullseye>
      )}
    </PageSection>
  )
}
