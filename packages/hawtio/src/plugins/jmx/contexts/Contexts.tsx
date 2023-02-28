import { Card, CardBody, Text } from '@patternfly/react-core'
import { InfoCircleIcon } from '@patternfly/react-icons'
import { Table, TableBody, TableHeader, TableProps, wrappable } from '@patternfly/react-table'
import { IResponse } from 'jolokia.js'
import { AttributeValues } from '@hawtiosrc/plugins/connect/jolokia-service'
import { useEffect, useState, useContext } from 'react'
import { PluginNodeSelectionContext } from '@hawtiosrc/plugins'
import { log } from '../globals'
import { contextsService, ContextAttributes } from './contexts-service'
import { moveElement } from '@hawtiosrc/util/arrays'

export const Contexts: React.FunctionComponent = () => {
  const {selectedNode} = useContext(PluginNodeSelectionContext)

  const emptyCtxs: ContextAttributes[] = []
  const [contexts, setContexts] = useState(emptyCtxs)
  const [isReading, setIsReading] = useState(true)

  useEffect(() => {
    setIsReading(true)
    const readAttributes = async () => {
      const ctxs = await contextsService.getContexts(selectedNode)
      setContexts(ctxs)
      setIsReading(false)
    }
    readAttributes()
  }, [selectedNode])

  useEffect(() => {
    if (!contexts || contexts.length === 0)
      return

    for (const [idx, ctx] of contexts.entries()) {
      const mbean = ctx.MBean
      contextsService.register({ type: 'read', mbean }, (response: IResponse) => {
        log.debug('Scheduler - Contexts:', response.value)

        /* Replace the context in the existing set with the new one */
        const newCtx: ContextAttributes = contextsService.createContextAttibutes(
          ctx.Context, mbean, response.value as AttributeValues)

        /* Replace the context in the contexts array */
        const newContexts = [...contexts]
        newContexts.splice(idx, 1, newCtx)
        setContexts(newContexts)
      })
    }

    return () => contextsService.unregisterAll()
  }, [selectedNode, contexts])

  if (!selectedNode) {
    return null
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
   * Reformat the contexts into a single object
   * keyed by property names
   */
  const contextData: {
    [key: string]: string[]
  } = {}

  for(const [idx, ctx] of contexts.entries()) {
    for(const [key, value] of Object.entries(ctx)) {
      if (key === 'MBean') continue // Do not need to display

      if (! Object.hasOwn(contextData, key)) {
        contextData[key] = []
        // Pad other contexts with an empty value
        for (let i = 0; i < idx; ++i) {
          contextData[key].push('')
        }
      }
      contextData[key].push(value)
    }
  }

  /**
   * Extract the property names and sort them to form the column headers
   */
  const headerNames = Object.keys(contextData)
  headerNames.sort()
  moveElement(headerNames, 'State', 0)
  moveElement(headerNames, 'Context', 0)

  /**
   * Populate the column headers and data using the positions
   * of the headers in the array to ensure the correct locations
   * of the data
   */
  const columns: TableProps['cells'] = []
  const rows: TableProps['rows'] = []
  for (const [idx, headerName] of headerNames.entries()) {
    columns.push({title: headerName, transforms: [wrappable]})
    const dataCol = contextData[headerName]
    for (const [dx, d] of dataCol.entries()) {
      if (rows[dx] === undefined)
        rows[dx] = []

      rows[dx].splice(idx, 0, d)
    }
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

  return (
    <Card isFullHeight>
      <Table aria-label='Contexts' variant={'compact'} cells={columns} rows={rows}>
        <TableHeader />
        <TableBody />
      </Table>
    </Card>
  )
}
