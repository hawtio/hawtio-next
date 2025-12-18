import { FilteredTable } from '@hawtiosrc/ui'
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  CodeBlock,
  CodeBlockCode,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  PageSection,
  Skeleton,
  Title,
} from '@patternfly/react-core'
import { Modal } from '@patternfly/react-core/deprecated'
import React, { useEffect, useRef, useState } from 'react'
import { log } from './globals'
import { LogEntry } from './log-entry'
import { LOGS_UPDATE_INTERVAL, logsService } from './logs-service'
import './Logs.css'

export const Logs: React.FunctionComponent = () => {
  return (
    <React.Fragment>
      <PageSection id='logs-header' hasBodyWrapper={false}>
        <Title headingLevel='h1'>Logs</Title>
      </PageSection>
      <PageSection id='logs-table' padding={{ default: 'noPadding' }} isFilled hasBodyWrapper={false}>
        <LogsTable />
      </PageSection>
    </React.Fragment>
  )
}

class LogRowData {
  timestamp: string
  level: string
  logger: string
  message: string
  logEntry: LogEntry

  constructor(entry: LogEntry) {
    this.timestamp = entry.getTimestamp()
    this.level = entry.event.level
    this.logger = entry.event.logger
    this.message = entry.event.message
    this.logEntry = entry
  }
}

const LogsTable: React.FunctionComponent = () => {
  const [, setLogs] = useState<LogEntry[]>([])
  const [rows, setRows] = useState<LogRowData[]>([])
  const timestamp = useRef(0)
  const [loaded, setLoaded] = useState(false)

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selected, setSelected] = useState<LogEntry | null>(null)

  useEffect(() => {
    const loadLogs = async () => {
      const result = await logsService.loadLogs()
      setLogs(result.logs)
      setRows(result.logs.map(log => new LogRowData(log)))
      timestamp.current = result.timestamp
      setLoaded(true)
      log.debug('Load logs:', timestamp.current)
    }
    loadLogs()

    // Jolokia scheduler cannot be used since we need to update timestamp for the
    // argument to each MBean invocation.
    let timeoutHandle: NodeJS.Timeout
    const updateLogs = async () => {
      log.debug('Update logs:', timestamp.current)
      // Skip initial update
      if (timeoutHandle && timestamp.current > 0) {
        const result = await logsService.loadLogsAfter(timestamp.current)
        if (result.logs.length > 0) {
          setLogs(prev => {
            const logsAppended = logsService.append(prev, result.logs)
            setRows(logsAppended.map(log => new LogRowData(log)))
            return logsAppended
          })
        }
        timestamp.current = result.timestamp
      }

      timeoutHandle = setTimeout(() => updateLogs(), LOGS_UPDATE_INTERVAL)
    }
    updateLogs()

    return () => timeoutHandle && clearTimeout(timeoutHandle)
  }, [])

  if (!loaded) {
    return <Skeleton data-testid='loading-logs' screenreaderText='Loading...' />
  }

  const logLevels = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR']

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen)
  }

  return (
    <React.Fragment>
      <LogModal isOpen={isModalOpen} onClose={handleModalToggle} log={selected} />
      <FilteredTable
        rows={rows}
        highlightSearch={true}
        tableColumns={[
          {
            name: 'Timestamp',
            key: 'timestamp',
            percentageWidth: 10,
          },
          {
            name: 'Level',
            key: 'level',
            renderer: val => <LogLevel level={val.level} />,
            percentageWidth: 10,
          },
          {
            name: 'Logger',
            key: 'logger',
            percentageWidth: 40,
          },
          {
            name: 'Message',
            key: 'message',
            percentageWidth: 40,
          },
        ]}
        fixedSearchCategories={[
          {
            name: 'Level',
            key: 'level',
            id: 'logs-table-toolbar-level',
            ariaLabel: 'Filter level',
            values: logLevels,
            renderer: val => <LogLevel level={val} />,
          },
        ]}
        searchCategories={[
          {
            name: 'Logger',
            key: 'logger',
          },
          {
            name: 'Message',
            key: 'message',
          },
        ]}
        onClick={row => {
          setSelected(row.logEntry)
          setIsModalOpen(true)
        }}
      />
    </React.Fragment>
  )
}

const LogModal: React.FunctionComponent<{
  isOpen: boolean
  onClose: () => void
  log: LogEntry | null
}> = ({ isOpen, onClose, log }) => {
  if (!log) {
    return null
  }

  const { event } = log

  const logDetails = (
    <Card isCompact isPlain>
      <CardBody>
        <DescriptionList isCompact isHorizontal>
          <DescriptionListGroup>
            <DescriptionListTerm>Timestamp</DescriptionListTerm>
            <DescriptionListDescription>{log.getTimestamp()}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Level</DescriptionListTerm>
            <DescriptionListDescription>
              <LogLevel level={event.level} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Logger</DescriptionListTerm>
            <DescriptionListDescription>{event.logger}</DescriptionListDescription>
          </DescriptionListGroup>
          {log.hasLogSourceLineHref && (
            <React.Fragment>
              <DescriptionListGroup>
                <DescriptionListTerm>Class</DescriptionListTerm>
                <DescriptionListDescription>{event.className}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Method</DescriptionListTerm>
                <DescriptionListDescription>{event.methodName}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>File</DescriptionListTerm>
                <DescriptionListDescription>
                  {event.fileName}:{event.lineNumber}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </React.Fragment>
          )}
          {event.host && (
            <DescriptionListGroup>
              <DescriptionListTerm>Host</DescriptionListTerm>
              <DescriptionListDescription>{event.host}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
          <DescriptionListGroup>
            <DescriptionListTerm>Thread</DescriptionListTerm>
            <DescriptionListDescription>{event.thread}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Message</DescriptionListTerm>
            <DescriptionListDescription>
              <CodeBlock>
                <CodeBlockCode>{event.message}</CodeBlockCode>
              </CodeBlock>
            </DescriptionListDescription>
          </DescriptionListGroup>
          {event.exception && (
            <DescriptionListGroup>
              <DescriptionListTerm>Stack Trace</DescriptionListTerm>
              <DescriptionListDescription>{event.exception}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
      </CardBody>
    </Card>
  )

  const osgiProperties = log.hasOSGiProperties && (
    <Card isCompact isPlain>
      <CardTitle>OSGi Properties</CardTitle>
      <CardBody>
        <DescriptionList isCompact isHorizontal>
          {[
            { key: 'bundle.name', name: 'Bundle Name' },
            { key: 'bundle.id', name: 'Bundle ID' },
            { key: 'bundle.version', name: 'Bundle Version' },
          ]
            .filter(({ key }) => event.properties[key] !== undefined)
            .map(({ key, name }) => (
              <DescriptionListGroup key={key}>
                <DescriptionListTerm>${name}</DescriptionListTerm>
                <DescriptionListDescription>{event.properties[key]}</DescriptionListDescription>
              </DescriptionListGroup>
            ))}
        </DescriptionList>
      </CardBody>
    </Card>
  )

  const mdcProperties = log.hasMDCProperties && (
    <Card isCompact isPlain>
      <CardTitle>MDC Properties</CardTitle>
      <CardBody>
        <DescriptionList isCompact isHorizontal>
          {Object.entries(log.mdcProperties).map(([key, value]) => (
            <DescriptionListGroup key={key}>
              <DescriptionListTerm>{key}</DescriptionListTerm>
              <DescriptionListDescription>{value}</DescriptionListDescription>
            </DescriptionListGroup>
          ))}
        </DescriptionList>
      </CardBody>
    </Card>
  )

  return (
    <Modal
      id='logs-log-modal'
      variant='large'
      title='Log'
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        <Button key='close' onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      {logDetails}
      {osgiProperties}
      {mdcProperties}
    </Modal>
  )
}

const LogLevel: React.FunctionComponent<{ level: string }> = ({ level }) => {
  switch (level) {
    case 'TRACE':
    case 'DEBUG':
      return <Label color='grey'>{level}</Label>
    case 'INFO':
      return <Label color='blue'>{level}</Label>
    case 'WARN':
      return <Label color='orange'>{level}</Label>
    case 'ERROR':
      return <Label color='red'>{level}</Label>
    default:
      return level
  }
}
