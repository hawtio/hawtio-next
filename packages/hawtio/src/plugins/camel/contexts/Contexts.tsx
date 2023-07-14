import { eventService } from '@hawtiosrc/core'
import { CamelContext } from '@hawtiosrc/plugins/camel/context'
import { AttributeValues } from '@hawtiosrc/plugins/shared/jolokia-service'
import { HawtioLoadingCard } from '@hawtiosrc/plugins/shared'
import { Card, CardBody, Text } from '@patternfly/react-core'
import { InfoCircleIcon } from '@patternfly/react-icons'
import { Table, TableBody, TableHeader, TableProps, wrappable } from '@patternfly/react-table'
import { IResponse } from 'jolokia.js'
import React, { useContext, useEffect, useState } from 'react'
import { log } from '../globals'
import { ContextToolbar } from './ContextToolbar'
import { ContextState, contextsService } from './contexts-service'

export const Contexts: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const [isReading, setIsReading] = useState(true)

  const emptyCtxs: ContextState[] = []
  const [contexts, setContexts] = useState(emptyCtxs)
  const [selectedCtx, setSelectedCtx] = useState<ContextState[]>([])

  const onSelectContext = (ctx: ContextState, isSelecting: boolean) => {
    const otherSelectedCtx = selectedCtx.filter(c => c.node !== ctx.node)
    setSelectedCtx(isSelecting ? [...otherSelectedCtx, ctx] : [...otherSelectedCtx])
  }

  const selectAllContexts = (isSelecting = true) => {
    setSelectedCtx(isSelecting ? [...contexts] : [])
  }

  const isContextSelected = (ctx: ContextState) => {
    return selectedCtx.includes(ctx)
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
    for (const [idx, ctx] of contexts.entries()) {
      const { objectName } = ctx.node
      if (!objectName) {
        continue
      }
      contextsService.register({ type: 'read', mbean: objectName }, (response: IResponse) => {
        log.debug('Scheduler - Contexts:', response.value)

        // Replace the context in the existing set with the new one
        const attrs = response.value as AttributeValues
        const newCtx = contextsService.toContextState(ctx.node, attrs)

        // Replace the context in the contexts array
        const newContexts = [...contexts]
        newContexts.splice(idx, 1, newCtx)
        setContexts(newContexts)
      })
    }

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
    <Card isFullHeight>
      <ContextToolbar contexts={selectedCtx} deleteCallback={handleDeletedContexts} />
      <Table
        onSelect={(_event, isSelecting, rowIndex) => {
          if (rowIndex === -1) {
            selectAllContexts(isSelecting)
          } else {
            const ctx = contexts[rowIndex]
            if (ctx) {
              onSelectContext(ctx, isSelecting)
            }
          }
        }}
        canSelectAll={true}
        aria-label='Contexts'
        variant='compact'
        cells={columns}
        rows={rows}
      >
        <TableHeader />
        <TableBody />
      </Table>
    </Card>
  )
}
