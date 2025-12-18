import { FilteredTable } from '@hawtiosrc/ui'
import { Button, CodeBlock, CodeBlockCode, Flex, Icon, Label } from '@patternfly/react-core'
import { Modal } from '@patternfly/react-core/deprecated'
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon'
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon'
import React, { useEffect, useState } from 'react'
import { springbootService } from './springboot-service'
import { Trace } from './types'

const HttpStatusIcon: React.FunctionComponent<{
  code: number
}> = ({ code }) => {
  if (code >= 400) {
    return (
      <Icon status='danger'>
        <ExclamationCircleIcon />
      </Icon>
    )
  }

  return (
    <Icon status='success'>
      <CheckCircleIcon />
    </Icon>
  )
}

const HttpMethodLabel: React.FunctionComponent<{
  method: string
}> = ({ method }) => {
  switch (method) {
    case 'GET':
    case 'HEAD':
      return <Label color='blue'>{method}</Label>
    case 'POST':
      return <Label color='orange'>{method}</Label>
    case 'DELETE':
      return <Label color='red'>{method}</Label>
    case 'PUT':
    case 'PATCH':
      return <Label color='green'>{method}</Label>
    default:
      return <Label color='grey'>{method}</Label>
  }
}

const TraceDetails: React.FunctionComponent<{
  isOpen: boolean
  setIsOpen: (opened: boolean) => void
  traceInfo: string
}> = ({ isOpen, setIsOpen, traceInfo }) => {
  return (
    <Modal
      bodyAriaLabel='Trace detail'
      tabIndex={0}
      isOpen={isOpen}
      variant='large'
      title='Trace'
      onClose={() => setIsOpen(false)}
    >
      <CodeBlock>
        <CodeBlockCode>{traceInfo}</CodeBlockCode>
      </CodeBlock>
    </Modal>
  )
}

export const TraceView: React.FunctionComponent = () => {
  const [traces, setTraces] = useState<Trace[]>([])
  const [isTraceDetailsOpen, setIsTraceDetailsOpen] = useState(false)
  const [traceDetails, setTraceDetails] = useState<string>('')

  useEffect(() => {
    springbootService.loadTraces().then(traces => {
      setTraces(traces)
    })
  }, [])

  return (
    <React.Fragment>
      <TraceDetails isOpen={isTraceDetailsOpen} setIsOpen={setIsTraceDetailsOpen} traceInfo={traceDetails} />
      <FilteredTable
        rows={traces}
        highlightSearch={true}
        tableColumns={[
          {
            name: 'Timestamp',
            key: 'timestamp',
            percentageWidth: 20,
          },
          {
            name: 'HTTP Status',
            key: 'httpStatusCode',
            percentageWidth: 10,
            renderer: val => (
              <Flex>
                <HttpStatusIcon code={val.httpStatusCode} />
                <span>{val.httpStatusCode}</span>
              </Flex>
            ),
          },
          {
            name: 'HTTP Method',
            key: 'method',
            renderer: val => <HttpMethodLabel method={val.method} />,
            percentageWidth: 10,
          },
          {
            name: 'Path',
            key: 'path',
            percentageWidth: 30,
          },
          {
            name: 'Time Taken',
            key: 'timeTaken',
            percentageWidth: 20,
          },
          {
            isAction: true,
            percentageWidth: 10,
            renderer: val => (
              <Button
                onClick={_event => {
                  setIsTraceDetailsOpen(true)
                  setTraceDetails(val.info)
                }}
                size='sm'
              >
                Show
              </Button>
            ),
          },
        ]}
        fixedSearchCategories={[
          {
            name: 'HTTP Method',
            key: 'method',
            ariaLabel: 'HTTP Method',
            values: ['GET', 'POST', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH', 'PUT', 'TRACE'],
            renderer: val => <HttpMethodLabel method={val} />,
          },
        ]}
        searchCategories={[
          { key: 'timestamp', name: 'Timestamp' },
          { key: 'httpStatusCode', name: 'HTTP Status' },
          { key: 'path', name: 'Path' },
          { key: 'timeTaken', name: 'Time Taken' },
        ]}
      />
    </React.Fragment>
  )
}
