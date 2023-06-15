import { Card, CardBody, Text } from '@patternfly/react-core'
import { InfoCircleIcon } from '@patternfly/react-icons'
import { Table, TableBody, TableHeader, TableProps, wrappable } from '@patternfly/react-table'
import { IResponse } from 'jolokia.js'
import { AttributeValues } from '@hawtiosrc/plugins/connect/jolokia-service'
import React, { useEffect, useState, useContext } from 'react'
import { CamelContext } from '@hawtiosrc/plugins/camel/context'
import { log } from '../globals'
import { contextsService, ContextAttributes } from './contexts-service'
import { eventService } from '@hawtiosrc/core'
import { ContextToolbar } from './ContextToolbar'

export const Contexts: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const [isReading, setIsReading] = useState(true)

  const emptyCtxs: ContextAttributes[] = []
  const [contexts, setContexts] = useState(emptyCtxs)
  const [selectedCtx, setSelectedCtx] = useState<ContextAttributes[]>([])

  const onSelectContext = (ctx: ContextAttributes, isSelecting: boolean) => {
    const otherSelectedCtx = selectedCtx.filter(c => c.context !== ctx.context)
    setSelectedCtx(isSelecting ? [...otherSelectedCtx, ctx] : [...otherSelectedCtx])
  }

  const selectAllContexts = (isSelecting = true) => {
    setSelectedCtx(isSelecting ? [...contexts] : [])
  }

  const isContextSelected = (ctx: ContextAttributes) => {
    return selectedCtx.includes(ctx)
  }

  useEffect(() => {
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

    for (const [idx, ctx] of contexts.entries()) {
      const mbean = ctx.mbean
      contextsService.register({ type: 'read', mbean }, (response: IResponse) => {
        log.debug('Scheduler - Contexts:', response.value)

        /* Replace the context in the existing set with the new one */
        const newCtx: ContextAttributes = contextsService.createContextAttributes(
          ctx.context,
          mbean,
          response.value as AttributeValues,
        )

        /* Replace the context in the contexts array */
        const newContexts = [...contexts]
        newContexts.splice(idx, 1, newCtx)
        setContexts(newContexts)
      })
    }

    return () => contextsService.unregisterAll()
  }, [selectedNode, contexts])

  if (!selectedNode) {
    return (
      <Card>
        <CardBody>
          <Text component='p'>No selection has been made</Text>
        </CardBody>
      </Card>
    )
  }

  if (isReading) {
    return (
      <Card>
        <CardBody>
          <Text component='p'>Reading contexts...</Text>
        </CardBody>
      </Card>
    )
  }

  /**
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
      cells: [ctx.context, ctx.state],
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
  const handleDeletedContexts = (deleted: ContextAttributes[]) => {
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
            onSelectContext(ctx, isSelecting)
          }
        }}
        canSelectAll={true}
        aria-label='Contexts'
        variant={'compact'}
        cells={columns}
        rows={rows}
      >
        <TableHeader />
        <TableBody />
      </Table>
    </Card>
  )
}
