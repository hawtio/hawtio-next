import { eventService } from '@hawtiosrc/core'
import { CamelContext } from '@hawtiosrc/plugins/camel/context'
import { HawtioLoadingCard } from '@hawtiosrc/plugins/shared'
import { AttributeValues } from '@hawtiosrc/plugins/shared/jolokia-service'
import { Card, CardBody, Text } from '@patternfly/react-core'
import { InfoCircleIcon } from '@patternfly/react-icons'
import { TableComposable, TableProps, Tbody, Td, Th, Thead, Tr, wrappable } from '@patternfly/react-table'
import { Response } from 'jolokia.js'
import React, { useContext, useEffect, useState } from 'react'
import { log } from '../globals'
import { ContextToolbar } from './ContextToolbar'
import { ContextState, contextsService } from './contexts-service'

export const Contexts: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const [isReading, setIsReading] = useState(true)

  const [contexts, setContexts] = useState<ContextState[]>([])
  const [selectedCtx, setSelectedCtx] = useState<string[]>([])

  const onSelectContext = (ctx: ContextState, isSelecting: boolean) => {
    const otherSelectedCtx = selectedCtx.filter(c => c !== ctx.node.name)
    setSelectedCtx(isSelecting ? [...otherSelectedCtx, ctx.node.name] : [...otherSelectedCtx])
  }

  const selectAllContexts = (isSelecting = true) => {
    setSelectedCtx(isSelecting ? contexts.map(c => c.node.name) : [])
  }

  const isContextSelected = (ctx: ContextState) => {
    return selectedCtx.includes(ctx.node.name)
  }

  useEffect(() => {
    if (!selectedNode) return

    setIsReading(true)
    const readAttributes = async () => {
      try {
        const ctxs = await contextsService.getContexts(selectedNode)
        setContexts(ctxs)
      } catch (error) {
        eventService.notify({
          type: 'warning',
          message: error as string,
        })
      }
      setIsReading(false)
    }
    readAttributes()
  }, [selectedNode])

  useEffect(() => {
    if (!contexts || contexts.length === 0) return

    // TODO: we should not invoke setContexts separately from multiple scheduler.
    // It should cause a bug of overwriting the other updates when we have multiple contexts.
    contexts.forEach((ctx, idx) => {
      const { objectName } = ctx.node
      if (!objectName) {
        return
      }
      contextsService.register({ type: 'read', mbean: objectName }, (response: Response) => {
        log.debug('Scheduler - Contexts:', response.value)

        // Replace the context in the existing set with the new one
        const attrs = response.value as AttributeValues
        const newCtx = contextsService.toContextState(ctx.node, attrs)

        // Replace the context in the contexts array
        const newContexts = [...contexts]
        newContexts.splice(idx, 1, newCtx)
        setContexts(newContexts)
      })
    })

    return () => contextsService.unregisterAll()
  }, [selectedNode, contexts])

  if (!selectedNode) {
    // When this view is routed, the virtual 'Camel Contexts' node should be always selected
    return null
  }

  if (isReading) {
    return <HawtioLoadingCard />
  }

  /*
   * Populate the column headers and data using the positions
   * of the headers in the array to ensure the correct locations
   * of the data
   */
  const columns: TableProps['cells'] = []
  columns.push({ title: 'Context', transforms: [wrappable] })
  columns.push({ title: 'State', transforms: [wrappable] })

  const rows: TableProps['rows'] = []
  for (const ctx of contexts) {
    rows.push({
      cells: [ctx.node.name, ctx.state],
      selected: isContextSelected(ctx),
    })
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardBody>
          <Text component='p'>
            <InfoCircleIcon /> This domain has no contexts.
          </Text>
        </CardBody>
      </Card>
    )
  }

  /*
   * Callback the is fired after the delete button has been
   * clicked in the toolbar
   */
  const handleDeletedContexts = (deleted: ContextState[]) => {
    const ctxs = contexts.filter(ctx => !deleted.includes(ctx))
    setContexts(ctxs)
  }

  return (
    <React.Fragment>
      <ContextToolbar
        contexts={contexts.filter(c => selectedCtx.includes(c.node.name))}
        deleteCallback={handleDeletedContexts}
      />
      <TableComposable aria-label='Contexts' variant='compact'>
        <Thead>
          <Tr>
            <Th
              select={{
                onSelect: (_event, isSelecting) => selectAllContexts(isSelecting),
                isSelected: contexts.length === selectedCtx.length,
              }}
            />
            <Th key='context-header'>Context</Th>
            <Th key={'state-header'}>State</Th>
          </Tr>
        </Thead>
        <Tbody>
          {contexts.map((ctx, idx) => (
            <Tr key={ctx.node.name}>
              <Td
                select={{
                  rowIndex: idx,
                  onSelect: (_event, isSelecting) => onSelectContext(ctx, isSelecting),
                  isSelected: isContextSelected(ctx),
                }}
              />
              <Td key={'context-' + idx}>{ctx.node.name}</Td>
              <Td key={'state-' + idx}>{ctx.state}</Td>
            </Tr>
          ))}
        </Tbody>
      </TableComposable>
    </React.Fragment>
  )
}
