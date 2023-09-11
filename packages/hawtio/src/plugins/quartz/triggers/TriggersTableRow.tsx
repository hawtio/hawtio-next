import { Button, Icon } from '@patternfly/react-core'
import { CheckCircleIcon, PauseCircleIcon } from '@patternfly/react-icons'
import { ActionsColumn, Td, Tr } from '@patternfly/react-table'
import React, { useContext, useState } from 'react'
import { QuartzContext } from '../context'
import {
  QUARTZ_FACADE_OPERATIONS,
  QUARTZ_OPERATIONS,
  Trigger,
  misfireInstructions,
  quartzService,
} from '../quartz-service'
import { TriggersManualModal } from './TriggersManualModal'
import { TriggersUpdateModal } from './TriggersUpdateModal'

export const TriggersTableRow: React.FunctionComponent<{
  trigger: Trigger
  reload: () => void
}> = ({ trigger, reload }) => {
  const { selectedNode } = useContext(QuartzContext)
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [isManualOpen, setIsManualOpen] = useState(false)

  if (!selectedNode || !selectedNode.objectName) {
    return null
  }

  const { objectName } = selectedNode

  const canUpdateTrigger = () => {
    return selectedNode.hasInvokeRights(
      QUARTZ_FACADE_OPERATIONS.updateCronTrigger,
      QUARTZ_FACADE_OPERATIONS.updateSimpleTrigger,
    )
  }

  const handleUpdateToggle = () => {
    setIsUpdateOpen(!isUpdateOpen)
  }

  const canTriggerJob = () => {
    return selectedNode.hasInvokeRights(QUARTZ_OPERATIONS.triggerJob)
  }

  const handleManualToggle = () => {
    setIsManualOpen(!isManualOpen)
  }

  const canPauseTrigger = () => {
    return selectedNode.hasInvokeRights(QUARTZ_OPERATIONS.pauseTrigger)
  }

  const pauseTrigger = async () => {
    await quartzService.pauseTrigger(objectName, trigger.name, trigger.group)
    reload()
  }

  const canResumeTrigger = () => {
    return selectedNode.hasInvokeRights(QUARTZ_OPERATIONS.resumeTrigger)
  }

  const resumeTrigger = async () => {
    await quartzService.resumeTrigger(objectName, trigger.name, trigger.group)
    reload()
  }

  const toMisfireText = (misfireInstruction: number): string => {
    return misfireInstructions.find(({ value }) => misfireInstruction === value)?.label ?? 'Unknown'
  }

  const normalState = trigger.state?.toLowerCase() === 'normal'

  return (
    <React.Fragment>
      <Tr>
        <Td dataLabel='state'>
          {normalState ? (
            <Icon status='success'>
              <CheckCircleIcon />
            </Icon>
          ) : (
            <Icon>
              <PauseCircleIcon />
            </Icon>
          )}
        </Td>
        <Td dataLabel='group'>{trigger.group}</Td>
        <Td dataLabel='name'>{trigger.name}</Td>
        <Td dataLabel='type'>{trigger.type}</Td>
        <Td dataLabel='expression'>{trigger.expression}</Td>
        <Td dataLabel='misfireInstruction'>{toMisfireText(trigger.misfireInstruction)}</Td>
        <Td dataLabel='PreviousFire'>{trigger.previousFireTime?.toString()}</Td>
        <Td dataLabel='nextFire'>{trigger.nextFireTime?.toString()}</Td>
        <Td dataLabel='finalFire'>{trigger.finalFireTime?.toString()}</Td>
        <Td dataLabel='resume/pause' modifier='fitContent'>
          {normalState ? (
            <Button variant='danger' isSmall onClick={pauseTrigger} isDisabled={!canPauseTrigger()}>
              Pause
            </Button>
          ) : (
            <Button variant='primary' isSmall onClick={resumeTrigger} isDisabled={!canResumeTrigger()}>
              Resume
            </Button>
          )}
        </Td>
        <Td isActionCell>
          <ActionsColumn
            items={[
              {
                title: 'Update Trigger',
                isDisabled: !canUpdateTrigger(),
                onClick: handleUpdateToggle,
              },
              {
                title: 'Trigger Manually',
                isDisabled: !canTriggerJob(),
                onClick: handleManualToggle,
              },
            ]}
          />
        </Td>
      </Tr>
      <TriggersUpdateModal isOpen={isUpdateOpen} onClose={handleUpdateToggle} input={trigger} reload={reload} />
      <TriggersManualModal isOpen={isManualOpen} onClose={handleManualToggle} input={trigger} />
    </React.Fragment>
  )
}
