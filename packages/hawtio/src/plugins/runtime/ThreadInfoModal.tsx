import React from 'react'
import { Thread } from '@hawtiosrc/plugins/runtime/types'
import { Grid, GridItem, Label, Modal, ModalVariant } from '@patternfly/react-core'

export const ThreadState: React.FunctionComponent<{ state: string }> = ({ state }) => {
  switch (state) {
    case 'RUNNABLE':
      return <Label color='green'>{state}</Label>
    case 'WAITING':
    case 'TIMED_WAITING':
      return <Label color='orange'>{state}</Label>
    default:
      return <Label color='grey'>{state}</Label>
  }
}
export const ThreadInfoModal: React.FunctionComponent<{
  thread?: Thread
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}> = ({ thread, isOpen, setIsOpen }) => {
  if (!thread) {
    return null
  }

  return (
    <Modal
      bodyAriaLabel='Thread Details'
      tabIndex={0}
      variant={ModalVariant.medium}
      title='Thread details'
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    >
      <Grid hasGutter>
        <CustomItem itemName='ID' itemValue={thread.threadId} />
        <CustomItem itemName='State' itemValue={thread.threadState} />
        <CustomItem itemName='Name' itemValue={thread.threadName} />
        <CustomItem itemName='Native' itemValue={thread.inNative ? 'Yes' : 'No'} />
        <CustomItem itemName='Suspended' itemValue={thread.suspended ? 'Yes' : 'No'} />
        <CustomItem itemName='Waited Count' itemValue={thread.waitedCount} />
        <CustomItem itemName='Waited Time' itemValue={thread.waitedTime} />
        <CustomItem itemName='Blocked Count' itemValue={thread.blockedCount} />
        <CustomItem itemName='Blocked Time' itemValue={thread.blockedTime} />

        {thread.lockInfo && (
          <>
            <CustomItem itemName='Lock Name' itemValue={thread.lockInfo.lockName} />
            <CustomItem itemName='Lock Class Name' itemValue={thread.lockInfo.className} />
            <CustomItem itemName='Identity Hash Code' itemValue={thread.lockInfo.identityHashCode} />
          </>
        )}

        <CustomItem itemName='Waiting for lock owned by' itemValue={thread.lockOwnerId} />
        {thread.lockedSynchronizers && thread.lockedSynchronizers.length > 0 && (
          <>
            <GridItem span={3}>
              <i>Locked Synchronizers</i>
            </GridItem>
            <GridItem span={9}>
              <>
                {thread.lockedSynchronizers.map(synchronizer => (
                  <>
                    <span title='Class Name'>{synchronizer.className}</span>
                    <span title='Identity Hash Code'>{synchronizer.identityHashCode}</span>
                  </>
                ))}
              </>
            </GridItem>
          </>
        )}

        {thread.lockedMonitors && thread.lockedMonitors.length > 0 && (
          <>
            <GridItem span={3}>
              <i>Locked Monitors</i>
            </GridItem>
            <GridItem span={9}>
              <ol>
                {thread.lockedMonitors.map((monitor, index) => (
                  <li key={'monitor-key-' + index}>
                    Frame: <strong>{monitor.lockedStackDepth}</strong>
                    <span style={{ color: '#4cb140' }}>{monitor.lockedStackFrame.className}</span>
                    <strong>.</strong>
                    <strong>
                      <span style={{ color: '#519de9' }}>{monitor.lockedStackFrame.methodName}</span>
                    </strong>
                    ({monitor.lockedStackFrame.fileName}
                    {monitor.lockedStackFrame.lineNumber > 0 && <span>:{monitor.lockedStackFrame.lineNumber}</span>}
                    {monitor.lockedStackFrame.nativeMethod && <span style={{ color: 'orange' }}>(Native)</span>}
                  </li>
                ))}
              </ol>
            </GridItem>
          </>
        )}
        {thread.stackTrace.length > 0 && (
          <>
            <GridItem span={2}>
              <i>Stack Trace</i>
            </GridItem>
            <GridItem span={10}>
              <ol>
                {thread.stackTrace.map((frame, index) => (
                  <li key={'stacktrace-' + index}>
                    <span style={{ color: '#4cb140' }}>{frame.className}</span>
                    <strong>.</strong>
                    <strong>
                      <span style={{ color: '#519de9' }}>{frame.methodName}</span>
                    </strong>
                    {'('}
                    {frame.fileName} {frame.lineNumber > 0 && <span>:{frame.lineNumber}</span>}
                    {')'}
                    {frame.nativeMethod && <span style={{ color: 'orange' }}>(Native)</span>}
                  </li>
                ))}
              </ol>
            </GridItem>
          </>
        )}
      </Grid>
    </Modal>
  )
}

const CustomItem: React.FunctionComponent<{
  itemName: string
  itemValue: string | number | null
}> = ({ itemName, itemValue }) => {
  if (!itemValue) {
    return null
  }

  if (typeof itemValue === 'number' && itemValue < 0) {
    return null
  }

  if (typeof itemValue === 'string' && itemValue === '') {
    return null
  }

  return (
    <>
      <GridItem span={3}>
        <i>{itemName}</i>
      </GridItem>
      <GridItem span={9}> {itemName === 'State' ? <ThreadState state={itemValue as string} /> : itemValue}</GridItem>
    </>
  )
}
