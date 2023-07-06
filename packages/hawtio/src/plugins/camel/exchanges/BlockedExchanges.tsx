import { CamelContext } from '@hawtiosrc/plugins/camel/context'
import { HawtioEmptyCard, HawtioLoadingCard, MBeanNode } from '@hawtiosrc/plugins/shared'
import { Button, Card, CardBody, CardTitle, Modal, ModalVariant } from '@patternfly/react-core'
import { Table, TableBody, TableHeader, TableProps, TableText, fitContent, wrappable } from '@patternfly/react-table'
import React, { useContext, useEffect, useRef, useState } from 'react'
import * as exs from './exchanges-service'

export const BlockedExchanges: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const [isReading, setIsReading] = useState(false)
  const [exchanges, setExchanges] = useState<exs.Exchange[]>([])
  const [isConfirmUnblockOpen, setIsConfirmUnblockOpen] = useState(false)
  const [exchangeToUnblock, setExchangeToUnblock] = useState<exs.Exchange | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  /*
   * setTimeout will cache the original state so need to use a ref
   * to allow fetchExchanges() to retrieve the latest value
   */
  const isConfirmUnblockOpenRef = useRef(isConfirmUnblockOpen)
  isConfirmUnblockOpenRef.current = isConfirmUnblockOpen

  const handleConfirmUnblockToggle = () => {
    setIsConfirmUnblockOpen(!isConfirmUnblockOpen)
  }

  const onUnblockClicked = (exchange: exs.Exchange) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setExchangeToUnblock(exchange)
    handleConfirmUnblockToggle()
  }

  const onUnblockConfirmClicked = () => {
    if (!exchangeToUnblock) return
    exs.unblockExchange(selectedNode as MBeanNode, exchangeToUnblock).then(() => {
      handleConfirmUnblockToggle()
    })
  }

  useEffect(() => {
    if (!selectedNode) return

    const fetchExchanges = async () => {
      if (!selectedNode) return

      if (!isConfirmUnblockOpenRef.current) {
        setIsReading(true)
        setExchanges(await exs.getBlockedExchanges(selectedNode))
        setIsReading(false)

        timerRef.current = setTimeout(fetchExchanges, 10000)
      } else if (isConfirmUnblockOpen && timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    fetchExchanges()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [selectedNode, isConfirmUnblockOpen])

  if (isReading) {
    return <HawtioLoadingCard />
  }

  if (exchanges.length === 0) {
    return <HawtioEmptyCard title='Blocked Exchanges' message='No blocked exchanges found.' testid='no-exchanges' />
  }

  const columns: TableProps['cells'] = []
  columns.push({ title: 'Exchange ID', transforms: [wrappable] })
  columns.push({ title: 'Route ID', transforms: [wrappable] })
  columns.push({ title: 'Node ID', transforms: [wrappable] })
  columns.push({ title: 'Duration (ms)', transforms: [wrappable] })
  columns.push({ title: 'Elapsed (ms)', transforms: [wrappable] })
  columns.push({ title: '', dataLabel: 'Action', transforms: [fitContent] })

  const rows: TableProps['rows'] = exchanges.map(ex => {
    const unblockActionButton = (
      <TableText>
        <Button variant='secondary' onClick={() => onUnblockClicked(ex)}>
          Unblock
        </Button>
      </TableText>
    )

    return [ex.exchangeId, ex.routeId, ex.nodeId, ex.duration, ex.elapsed, unblockActionButton]
  })

  const ConfirmUnblockModal = () => (
    <Modal
      variant={ModalVariant.small}
      title='Unblock Exchange'
      titleIconVariant='danger'
      isOpen={isConfirmUnblockOpen}
      onClose={handleConfirmUnblockToggle}
      actions={[
        <Button key='unblock' variant='danger' data-testid='confirm-unblock' onClick={onUnblockConfirmClicked}>
          Unblock
        </Button>,
        <Button key='cancel' variant='link' data-testid='confirm-cancel' onClick={handleConfirmUnblockToggle}>
          Cancel
        </Button>,
      ]}
    >
      <p>You are about to unblock the selected thread.</p>
      <p>This operation cannot be undone so please be careful.</p>
    </Modal>
  )

  return (
    <Card isFullHeight>
      <CardTitle>Blocked Exchanges</CardTitle>
      <CardBody>
        <Table data-testid='exchange-table' aria-label='Blocked Exchanges' cells={columns} rows={rows}>
          <TableHeader />
          <TableBody />
        </Table>
        <ConfirmUnblockModal />
      </CardBody>
    </Card>
  )
}
