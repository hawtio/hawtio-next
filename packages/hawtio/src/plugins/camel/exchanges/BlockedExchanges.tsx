import { CamelContext } from '@hawtiosrc/plugins/camel/context'
import { HawtioEmptyCard, HawtioLoadingCard, MBeanNode } from '@hawtiosrc/plugins/shared'
import { Button, Modal, ModalVariant, Panel, PanelMainBody, Title } from '@patternfly/react-core'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import React, { useContext, useEffect, useRef, useState } from 'react'
import * as exs from './exchanges-service'
import { PanelHeader } from '@patternfly/react-core'
import { PanelMain } from '@patternfly/react-core'

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
    <Panel>
      <PanelHeader>
        <Title headingLevel='h3'>Blocked Exchanges</Title>
      </PanelHeader>
      <PanelMain>
        <PanelMainBody>
          <TableComposable variant={'compact'} data-testid='exchange-table' aria-label='Blocked Exchanges'>
            <Thead>
              <Tr>
                <Th modifier='wrap'>Exchange ID</Th>
                <Th modifier='wrap'>Route ID</Th>
                <Th modifier='wrap'>Node ID</Th>
                <Th modifier='wrap'>Duration (ms)</Th>
                <Th modifier='wrap'>Elapsed (ms)</Th>
                <Th dataLabel='Action' wrap=''></Th>
              </Tr>
            </Thead>
            <Tbody>
              {exchanges.map((ex, index) => (
                <Tr key={ex.exchangeId + '-' + index}>
                  <Td>{ex.exchangeId}</Td>g <Td>{ex.routeId}</Td>
                  <Td>{ex.nodeId}</Td>
                  <Td>{ex.duration}</Td>
                  <Td>{ex.elapsed}</Td>
                  <Td>
                    <Button variant='link' onClick={() => onUnblockClicked(ex)}>
                      Unblock
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </TableComposable>
          <ConfirmUnblockModal />
        </PanelMainBody>
      </PanelMain>
    </Panel>
  )
}
