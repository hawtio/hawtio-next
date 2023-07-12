import { HawtioEmptyCard, HawtioLoadingCard } from '@hawtiosrc/plugins/shared'
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  SearchInput,
  Select,
  SelectDirection,
  SelectOption,
  SelectOptionObject,
  SelectVariant,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { IResponse } from 'jolokia.js'
import React, { ChangeEvent, MouseEvent, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { CamelContext } from '../context'
import { log } from '../globals'
import { RestService, restServicesService } from './rest-services-service'
import './rest-services.css'

const defaultFilterInputPlaceholder = 'Filter by URL ...'

interface TypeFilter {
  type: string
  value: string
}

const headers = ['URL', 'Method', 'Consumes', 'Produces', 'Route ID']

export const RestServices: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const [isReading, setIsReading] = useState(true)
  const [restSvcData, setRestSvcData] = useState<RestService[]>([])

  // Ref for toggle of filter type Select control
  const filterTypeToggleRef = useRef<HTMLButtonElement | null>()
  // Set of filters created by filter control and displayed as chips
  const [filters, setFilters] = useState<TypeFilter[]>([])
  // The type of filter to be created - chosen by the Select control
  const [filterType, setFilterType] = useState(headers[0] ?? '')
  // Flag to determine whether the Select control is open or closed
  const [isFilterTypeOpen, setIsFilterTypeOpen] = useState(false)
  // The text value of the filter to be created
  const [filterInput, setFilterInput] = useState<string>()
  // The placeholder of the filter input
  const [filterInputPlaceholder, setFilterInputPlaceholder] = useState<string>(defaultFilterInputPlaceholder)
  // The filtered rest services
  const [filteredRestSvcData, setFilteredRestSvcData] = useState<RestService[]>([])

  useEffect(() => {
    if (!selectedNode) return

    setIsReading(true)

    const fetchRest = async () => {
      const restServices = await restServicesService.getRestServices(selectedNode)
      setRestSvcData(restServices)
      setIsReading(false)
    }

    fetchRest()

    /*
     * Sets up polling and live updating of tracing
     */
    restServicesService.register(
      {
        type: 'exec',
        mbean: selectedNode.objectName as string,
        operation: 'listRestServices()',
      },
      (response: IResponse) => {
        log.debug('Scheduler - Debug:', response.value)
        fetchRest()
      },
    )

    // Unregister old handles
    return () => restServicesService.unregisterAll()
  }, [selectedNode])

  const applyFilter = useCallback((filter: TypeFilter, restService: RestService): boolean => {
    type RestSvcKey = keyof typeof restService

    const restSvcProp = restService[filter.type.toLowerCase() as RestSvcKey]

    // Want to filter on this property but value
    // is null so filter fails
    if (!restSvcProp) return false

    return restSvcProp.toLowerCase().includes(filter.value.toLowerCase())
  }, [])

  const filterRestSvcData = useCallback(
    (restServices: RestService[], theFilters: TypeFilter[]) => {
      const filtered = restServices.filter(restSvc => {
        let status = true
        for (const filter of theFilters) {
          if (!applyFilter(filter, restSvc)) {
            // service fails filter so return
            status = false
            break
          }

          // service passes this filter so continue
        }
        return status
      })

      setFilteredRestSvcData(filtered)
    },
    [setFilteredRestSvcData, applyFilter],
  )

  useEffect(() => {
    filterRestSvcData(restSvcData, filters)
  }, [filterRestSvcData, restSvcData, filters])

  if (!selectedNode) {
    return <HawtioEmptyCard message='No selection has been made.' />
  }

  if (isReading) {
    return <HawtioLoadingCard />
  }

  const clearFilters = () => {
    setFilters([])
    setFilterInput('')
    setFilteredRestSvcData([...restSvcData])
  }

  const createFilter = (value: string) => {
    setFilterInput(value)

    if (!filterType) return

    const filter = {
      type: filterType.toLowerCase(),
      value: value,
    }

    if (filters.includes(filter)) return

    const newFilters = filters.concat(filter)
    setFilters(newFilters)
    filterRestSvcData(restSvcData, newFilters)
  }

  const deleteFilter = (filterChip: string) => {
    const removed = filters.filter(filter => {
      return filterChip !== filter.type + ':' + filter.value
    })

    setFilters(removed)
    filterRestSvcData(restSvcData, removed)
  }

  const onSelectFilterType = (
    event: ChangeEvent<Element> | MouseEvent<Element>,
    value: string | SelectOptionObject,
    isPlaceholder?: boolean,
  ) => {
    if (isPlaceholder || !value) return

    setFilterType(value as string)
    setFilterInputPlaceholder('Filter by ' + value + ' ...')
    setIsFilterTypeOpen(false)
    filterTypeToggleRef?.current?.focus()
  }

  const onSelectFilterTypeToggle = (isOpen: boolean) => {
    setIsFilterTypeOpen(isOpen)
  }

  const filterChips = (): string[] => {
    const chips: string[] = []
    filters.forEach(filter => {
      chips.push(filter.type + ':' + filter.value)
    })

    return chips
  }

  return (
    <Card isFullHeight>
      <CardHeader>
        <CardTitle>REST Services</CardTitle>
      </CardHeader>
      <CardBody id='rest-services-card-body'>
        <Toolbar clearAllFilters={clearFilters}>
          <ToolbarContent>
            <ToolbarGroup variant='filter-group'>
              <ToolbarItem>
                <Select
                  toggleRef={() => filterTypeToggleRef}
                  variant={SelectVariant.single}
                  id='select-filter-type'
                  aria-label='select-filter-type'
                  onToggle={onSelectFilterTypeToggle}
                  onSelect={onSelectFilterType}
                  selections={filterType}
                  isOpen={isFilterTypeOpen}
                  direction={SelectDirection.down}
                >
                  {headers.map((name, index) => (
                    <SelectOption key={name + '-' + index} value={name} />
                  ))}
                </Select>
              </ToolbarItem>
              <ToolbarFilter
                chips={filterChips()}
                deleteChip={(_e, filter) => deleteFilter(filter as string)}
                deleteChipGroup={clearFilters}
                categoryName='Filters'
              >
                <SearchInput
                  type='text'
                  id='search-filter-input'
                  aria-label='filter input value'
                  placeholder={filterInputPlaceholder}
                  value={filterInput}
                  onChange={(_event, value) => setFilterInput(value)}
                  onClear={() => setFilterInput('')}
                  onSearch={(_event, value) => createFilter(value)}
                />
              </ToolbarFilter>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
        <TableComposable aria-label='message table' variant='compact' isStriped>
          <Thead>
            <Tr>
              {headers.map(header => (
                <Th key={header}>{header}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody isOddStriped>
            {filteredRestSvcData.map(rsdata => (
              <Tr key={rsdata.url + '_' + rsdata.method}>
                <Td dataLabel='URL'>{rsdata.url}</Td>
                <Td dataLabel='Method'>{rsdata.method}</Td>
                <Td dataLabel='Consumes'>{rsdata.consumes}</Td>
                <Td dataLabel='Produces'>{rsdata.produces}</Td>
                <Td dataLabel='Route ID'>{rsdata.routeId}</Td>
              </Tr>
            ))}
          </Tbody>
        </TableComposable>
      </CardBody>
    </Card>
  )
}
