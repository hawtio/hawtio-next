import { Button, Icon } from '@patternfly/react-core'
import { CheckCircleIcon, PauseCircleIcon } from '@patternfly/react-icons'
import { ActionsColumn, Td, Tr } from '@patternfly/react-table'
import React, { useState } from 'react'
import { Trigger, misfireInstructions, quartzService } from '../quartz-service'
import { TriggersUpdateModal } from './TriggersUpdateModal'
import { TriggersManualModal } from './TriggersManualModal'

export const TriggersTableRow: React.FunctionComponent<{
  mbean: string
  trigger: Trigger
}> = ({ mbean, trigger }) => {
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [isManualOpen, setIsManualOpen] = useState(false)

  const handleUpdateToggle = () => {
    setIsUpdateOpen(!isUpdateOpen)
  }

  const handleManualToggle = () => {
    setIsManualOpen(!isManualOpen)
  }

  const pauseTrigger = () => {
    quartzService.pauseTrigger(mbean, trigger.name, trigger.group)
  }

  const resumeTrigger = () => {
    quartzService.resumeTrigger(mbean, trigger.name, trigger.group)
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
            <Button variant='danger' isSmall onClick={pauseTrigger}>
              Pause
            </Button>
          ) : (
            <Button variant='primary' isSmall onClick={resumeTrigger}>
              Resume
            </Button>
          )}
        </Td>
        <Td isActionCell>
          <ActionsColumn
            items={[
              {
                title: 'Update Trigger',
                onClick: handleUpdateToggle,
              },
              {
                title: 'Trigger Manually',
                onClick: handleManualToggle,
              },
            ]}
          />
        </Td>
      </Tr>
      <TriggersUpdateModal isOpen={isUpdateOpen} onClose={handleUpdateToggle} mbean={mbean} input={trigger} />
      <TriggersManualModal isOpen={isManualOpen} onClose={handleManualToggle} mbean={mbean} input={trigger} />
    </React.Fragment>
  )
}
