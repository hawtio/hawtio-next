import React, { useEffect, useState } from 'react'
import { runtimeService } from './runtime-service'
import { FilteredTable } from '@hawtiosrc/ui'

export const SysProps: React.FunctionComponent = () => {
  const [properties, setProperties] = useState<{ key: string; value: string }[]>([])

  useEffect(() => {
    runtimeService.loadSystemProperties().then(props => {
      setProperties(props)
    })
  }, [])

  return (
    <FilteredTable
      tableColumns={[
        {
          name: 'Property Name',
          key: 'key',
          percentageWidth: 20,
        },
        {
          name: 'Property Value',
          key: 'value',
          percentageWidth: 80,
        },
      ]}
      rows={properties}
      searchCategories={[
        {
          name: 'Name',
          key: 'key',
        },
        {
          name: 'Value',
          key: 'value',
        },
      ]}
    ></FilteredTable>
  )
}
