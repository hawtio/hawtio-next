import { Button, CodeBlock, CodeBlockCode, Modal, ToolbarGroup, ToolbarItem } from '@patternfly/react-core'
import React, { useEffect, useState } from 'react'

import { Thread } from './types'
import { runtimeService } from './runtime-service'
import { ThreadInfoModal } from './ThreadInfoModal'
import { FilteredTable } from '@hawtiosrc/ui'

const ThreadsDumpModal: React.FunctionComponent<{
  isOpen: boolean
  setIsOpen: (opened: boolean) => void
}> = ({ isOpen, setIsOpen }) => {
  const [threadsDump, setThreadsDump] = useState('')

  useEffect(() => {
    const readThreadDump = async () => {
      const threadsDump = await runtimeService.dumpThreads()
      setThreadsDump(threadsDump)
    }
    if (isOpen) {
      readThreadDump()
    }
  }, [isOpen])

  return (
    <Modal
      bodyAriaLabel='Thread Dump'
      tabIndex={0}
      isOpen={isOpen}
      variant='large'
      title='Thread Dump'
      onClose={() => setIsOpen(false)}
    >
      <CodeBlock>
        <CodeBlockCode>{threadsDump}</CodeBlockCode>
      </CodeBlock>
    </Modal>
  )
}

export const Threads: React.FunctionComponent = () => {
  const [threads, setThreads] = useState<Thread[]>([])
  const [currentThread, setCurrentThread] = useState<Thread | undefined>()
  const [isThreadsDumpModalOpen, setIsThreadsDumpModalOpen] = useState(false)
  const [isThreadDetailsOpen, setIsThreadDetailsOpen] = useState(false)
  const [threadConnectionMonitoring, setThreadConnectionMonitoring] = useState(false)

  useEffect(() => {
    const readThreads = async () => {
      const threads = await runtimeService.loadThreads()
      setThreads(threads)
      setThreadConnectionMonitoring(await runtimeService.isThreadContentionMonitoringEnabled())
      runtimeService.registerLoadThreadsRequest(threads => {
        setThreads(threads)
      })
    }
    readThreads()
    return () => runtimeService.unregisterAll()
  }, [])

  const onThreadDumpClick = () => {
    setIsThreadsDumpModalOpen(true)
  }

  const handleConnectionThreadMonitoring = async () => {
    await runtimeService.enableThreadContentionMonitoring(!threadConnectionMonitoring)
    setThreadConnectionMonitoring(!threadConnectionMonitoring)
  }

  const DetailsButton = (thread: Thread) => (
    <Button
      onClick={_event => {
        setIsThreadDetailsOpen(true)
        setCurrentThread(thread)
      }}
      size='sm'
      variant='link'
    >
      Details
    </Button>
  )

  const ExtraToolBar = () => (
    <ToolbarGroup>
      <ToolbarItem>
        <Button variant='primary' onClick={handleConnectionThreadMonitoring} size='sm'>
          {threadConnectionMonitoring ? 'Disable' : 'Enable'} connection thread monitoring
        </Button>
      </ToolbarItem>
      <ToolbarItem>
        <Button variant='secondary' onClick={onThreadDumpClick} size='sm'>
          Thread dump
        </Button>
      </ToolbarItem>
    </ToolbarGroup>
  )

  return (
    <>
      <ThreadsDumpModal isOpen={isThreadsDumpModalOpen} setIsOpen={setIsThreadsDumpModalOpen} />
      <ThreadInfoModal isOpen={isThreadDetailsOpen} thread={currentThread} setIsOpen={setIsThreadDetailsOpen} />

      <FilteredTable
        tableColumns={[
          { key: 'threadId', name: 'ID' },
          { key: 'threadState', name: 'State' },
          { key: 'threadName', name: 'Name' },
          { key: 'waitedTime', name: 'Waited Time' },
          { key: 'blockedTime', name: 'Blocked Time' },
          { key: 'inNative', name: 'Native' },
          { key: 'suspended', name: 'Suspended' },
          { renderer: DetailsButton },
        ]}
        searchCategories={[
          {
            name: 'Name',
            key: 'threadName',
          },
          {
            name: 'State',
            key: 'threadState',
          },
        ]}
        rows={threads}
        extraToolbar={<ExtraToolBar />}
      />
    </>
  )
}
