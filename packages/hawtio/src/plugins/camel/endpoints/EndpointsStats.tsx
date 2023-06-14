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
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { SearchIcon } from '@patternfly/react-icons'

export const EndpointStats: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const [stats, setStats] = useState<EndpointStatistics[]>([])
  const [filteredStats, setFilteredStats] = useState<EndpointStatistics[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filters, setFilters] = useState<string[]>([])
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
      filtered = stats.filter(stat => {
        return (stat[attribute] as string).toLowerCase().includes(value.toLowerCase())
      })
    }

    //filter with the rest of the filters
    filters.forEach(value => {
      const attr = value.split(':')[0]
      const searchTerm = value.split(':')[1]
      filtered = filtered.filter(stat => (stat[attr] as string).toLowerCase().includes(searchTerm.toLowerCase()))
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

      {filteredStats.length > 0 ? (
        <FormGroup>
          <TableComposable aria-label='Endpoints Table' variant='compact' height='80vh'>
            <Thead>
              <Tr>
                <Th>URL</Th>
                <Th>Route ID</Th>
                <Th>Direction</Th>
                <Th>Static</Th>
                <Th>Dynamic</Th>
                <Th>Hits</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredStats.map((stat: EndpointStatistics, index) => {
                return (
                  <Tr key={index}>
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
