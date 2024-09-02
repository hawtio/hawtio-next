import {
  Bullseye,
  Dropdown,
  DropdownItem,
  DropdownList,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  FormGroup,
  MenuToggle,
  MenuToggleElement,
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
import { Table, Thead, Tr, Th, Tbody, Td, ThProps } from '@patternfly/react-table'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { SearchIcon } from '@patternfly/react-icons'
import { ExpandableText } from './ExpandableText'
import { isNumber, objectSorter } from '@hawtiosrc/util/objects'

interface Props<T> {
  extraToolbar?: React.ReactNode
  tableColumns: { name?: string; key?: keyof T; renderer?: (value: T) => React.ReactNode }[]
  rows: T[]
  searchCategories: { name: string; key: keyof T }[]
  onClick?: (value: T) => void
  onClearAllFilters?: () => void
  highlightSearch?: boolean
}

function numberOrString(value: unknown): string | number {
  if (isNumber(value)) {
    return Number(value)
  } else {
    return String(value)
  }
}

export function FilteredTable<T>({
  extraToolbar,
  tableColumns,
  rows,
  searchCategories,
  onClick,
  onClearAllFilters,
  highlightSearch = false,
}: Props<T>) {
  const defaultSearchCategory = searchCategories[0]?.key

  const [filters, setFilters] = useState<{ key?: keyof T; value: string; name: string }[]>([])
  const [searchTerm, setSearchTerm] = useState<{ key?: keyof T; value: string }>({
    key: defaultSearchCategory,
    value: '',
  })
  const [filteredRows, setFilteredRows] = useState<T[]>([])

  const [attributeMenuItem, setAttributeMenuItem] = useState<{ name: string; key: keyof T } | null>(() => {
    if (searchCategories[0]) {
      return { key: searchCategories[0].key, name: searchCategories[0].name }
    }
    return null
  })

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const [sortIndex, setSortIndex] = useState<number>(-1)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    let filtered: T[] = [...rows]

    //add current searchTerm and filter
    ;[...filters, searchTerm].forEach(filter => {
      const key = filter.key
      if (!key) {
        return
      }
      const searchTerm = filter.value
      filtered = filtered.filter(value => {
        return String(value[key]).toLowerCase().includes(searchTerm.toLowerCase())
      })
    })

    //If user is filtering - refreshing the threds themselves would reset the page count
    if (filtered.length != rows.length) {
      setPage(1)
    }
    setFilteredRows([...filtered])
  }, [rows, searchTerm, attributeMenuItem, filters])

  const getValuesForDisplay = useCallback(
    (item: T): (string | number)[] => {
      return tableColumns.map(({ key }) => numberOrString(key && item[key]))
    },
    [tableColumns],
  )

  const sortedFilteredRows = useMemo(() => {
    let sortedThreads = filteredRows
    if (sortIndex >= 0) {
      sortedThreads = filteredRows.sort((a, b) => {
        const aValue = getValuesForDisplay(a)[sortIndex]
        const bValue = getValuesForDisplay(b)[sortIndex]
        return objectSorter(aValue, bValue, sortDirection === 'desc')
      })
    }
    return sortedThreads
  }, [filteredRows, sortDirection, sortIndex, getValuesForDisplay])

  const clearFilters = () => {
    onClearAllFilters?.()
    setFilters([])
    setSearchTerm({
      key: searchTerm.key,
      value: '',
    })
  }

  const addToFilters = () => {
    if (searchTerm.value !== '' && attributeMenuItem) {
      setFilters([...filters, { ...searchTerm, name: attributeMenuItem.name }])
      setSearchTerm({ key: searchTerm.key, value: '' })
    }
  }

  const getRowPage = () => {
    const start = (page - 1) * perPage
    const end = start + perPage
    return filteredRows.slice(start, end)
  }

  const propsPagination = (
    <Pagination
      itemCount={filteredRows.length}
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

  const filterDropdownItems = searchCategories.map(category => (
    <DropdownItem key={`search-key-${category.name}`} onClick={() => setAttributeMenuItem(category)}>
      {category.name}
    </DropdownItem>
  ))

  const getFilterChips = () => {
    const chips = filters.map(({ name, value }) => `${name}: ${value}`)
    if (searchTerm.value) {
      chips.push(`${attributeMenuItem?.name}: ${searchTerm.value}`)
    }

    return chips
  }

  const onDeleteFilter = (filter: string) => {
    if (filter === `${attributeMenuItem}: ${searchTerm.value}`) {
      setSearchTerm({
        key: attributeMenuItem?.key,
        value: '',
      })
    } else {
      const newFilters = filters.filter(f => `${f.name}: ${f.value}` !== filter)
      setFilters(newFilters)
    }
  }

  const tableToolBar = (
    <Toolbar clearAllFilters={clearFilters}>
      <ToolbarContent>
        <ToolbarGroup>
          <Dropdown
            data-testid='attribute-select'
            onSelect={() => {
              setIsDropdownOpen(false)
              addToFilters()
            }}
            onOpenChange={setIsDropdownOpen}
            defaultValue='Name'
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle
                ref={toggleRef}
                data-testid='attribute-select-toggle'
                id='toggle-basic'
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {attributeMenuItem?.name}
              </MenuToggle>
            )}
            isOpen={isDropdownOpen}
          >
            <DropdownList>{filterDropdownItems}</DropdownList>
          </Dropdown>
          <ToolbarFilter
            chips={getFilterChips()}
            deleteChip={(_e, filter) => onDeleteFilter(filter as string)}
            deleteChipGroup={clearFilters}
            categoryName='Filters'
          >
            <SearchInput
              key='table-search-input'
              type='text'
              data-testid='filter-input'
              id='search-input'
              placeholder='Search...'
              value={searchTerm.value}
              onChange={(_event, value) => setSearchTerm({ key: attributeMenuItem?.key, value })}
              aria-label='Search input'
            />
          </ToolbarFilter>
        </ToolbarGroup>

        {extraToolbar}

        <ToolbarItem variant='pagination'>{propsPagination}</ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  )

  const getSortParams = (sortColumn: number): ThProps['sort'] | undefined => {
    if (tableColumns[sortColumn]?.name && tableColumns[sortColumn]?.key) {
      return {
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
      }
    }
    return undefined
  }

  const highlightSearchedText = (text: string, search: string) => {
    if (search === '') {
      return text
    }

    const lowerCaseSearch = search.toLowerCase()
    const res = text
      .split(new RegExp(`(${search})`, 'gi'))
      .map((s, i) => (s.toLowerCase() === lowerCaseSearch ? <mark key={i}>{s}</mark> : s))
    return res
  }

  const defaultCellRenderer = (data: (string | number)[], row: number, column: number) => {
    let text: React.ReactNode = data[column]
    if (highlightSearch) {
      text = highlightSearchedText(
        String(text),
        [...filters, searchTerm]
          .filter(f => f.key === tableColumns[column]?.key)
          .map(f => f.value)
          .join('|'),
      )
    }
    return <ExpandableText key={'col' + row + '-' + column + '-value'}>{text}</ExpandableText>
  }

  return (
    <Panel>
      <PanelHeader>{tableToolBar}</PanelHeader>
      <PanelMain>
        <PanelMainBody>
          {sortedFilteredRows.length > 0 && (
            <FormGroup>
              <Table aria-label='Message Table' variant='compact' height='80vh' isStriped isStickyHeader>
                <Thead>
                  <Tr>
                    {tableColumns.map((att, index) => (
                      <Th
                        key={'th-key' + index}
                        data-testid={`${String(att.key || index)}-header`}
                        sort={getSortParams(index)}
                      >
                        {att.name}
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {getRowPage().map((item, index) => {
                    const values = getValuesForDisplay(item)
                    return (
                      <Tr key={'row' + index} data-testid={'row' + index} onClick={() => onClick?.(item)}>
                        {tableColumns.map(({ renderer }, column) => (
                          <Td key={'col' + index + '-' + column}>
                            {renderer ? renderer(item) : defaultCellRenderer(values, index, column)}
                          </Td>
                        ))}
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </FormGroup>
          )}
          {sortedFilteredRows.length === 0 && (
            <Bullseye>
              <EmptyState>
                <EmptyStateHeader icon={<EmptyStateIcon icon={SearchIcon} />} />
                <EmptyStateBody>No results found.</EmptyStateBody>
              </EmptyState>
            </Bullseye>
          )}
        </PanelMainBody>
      </PanelMain>
    </Panel>
  )
}