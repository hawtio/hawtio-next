import { CamelContext } from '@hawtiosrc/plugins/camel/context'
import { HawtioEmptyCard, HawtioLoadingCard } from '@hawtiosrc/plugins/shared'
import { Card, CardBody, CardTitle } from '@patternfly/react-core'
import { Table, TableBody, TableHeader, TableProps, wrappable } from '@patternfly/react-table'
import React, { useContext, useEffect, useState } from 'react'
import * as exs from './exchanges-service'

export const InflightExchanges: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const [isReading, setIsReading] = useState(false)
  const [canDisplayInflight, setCanDisplayInflight] = useState(false)
  const [exchanges, setExchanges] = useState<exs.Exchange[]>([])

  useEffect(() => {
    if (!selectedNode) {
      return
    }

    setIsReading(true)

    let timeoutHandle: NodeJS.Timeout
    const fetchExchanges = async () => {
      const cb = await exs.canBrowseInflightExchanges(selectedNode)
      setCanDisplayInflight(cb)
      if (cb) setExchanges(await exs.getInflightExchanges(selectedNode))

      setIsReading(false)

      timeoutHandle = setTimeout(fetchExchanges, 10000)
    }

    fetchExchanges()

    return () => {
      clearTimeout(timeoutHandle)
    }
  }, [selectedNode])

  if (isReading) {
    return <HawtioLoadingCard />
  }

  if (!canDisplayInflight) {
    return (
      <HawtioEmptyCard
        title='Inflight Exchanges'
        message='Browsing of Inflight Exchanges has not been enabled.'
        testid='exchanges-denied'
      />
    )
  }

  if (exchanges.length === 0) {
    return <HawtioEmptyCard title='Inflight Exchanges' message='No inflight exchanges found.' testid='no-exchanges' />
  }

  const columns: TableProps['cells'] = []
  columns.push({ title: 'Exchange ID', transforms: [wrappable] })
  columns.push({ title: 'Route ID', transforms: [wrappable] })
  columns.push({ title: 'Node ID', transforms: [wrappable] })
  columns.push({ title: 'Duration (ms)', transforms: [wrappable] })
  columns.push({ title: 'Elapsed (ms)', transforms: [wrappable] })

  const rows: TableProps['rows'] = exchanges.map(ex => [ex.exchangeId, ex.routeId, ex.nodeId, ex.duration, ex.elapsed])

  return (
    <Card isFullHeight>
      <CardTitle>Inflight Exchanges</CardTitle>
      <CardBody>
        <Table data-testid='exchange-table' aria-label='Inflight Exchanges' cells={columns} rows={rows}>
          <TableHeader />
          <TableBody />
        </Table>
      </CardBody>
    </Card>
  )
}
