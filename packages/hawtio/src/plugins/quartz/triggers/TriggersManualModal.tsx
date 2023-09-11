import { Button, Form, FormGroup, Modal, TextArea } from '@patternfly/react-core'
import React, { useState } from 'react'
import { log } from '../globals'
import { Trigger, quartzService } from '../quartz-service'

export const TriggersManualModal: React.FunctionComponent<{
  isOpen: boolean
  onClose: () => void
  mbean: string
  input: Trigger
}> = ({ isOpen, onClose, mbean, input }) => {
  const [parameters, setParameters] = useState('{}')

  const { name, group } = input

  const fireTrigger = () => {
    log.info('Manually fire trigger:', mbean, input, parameters)
    quartzService.triggerJob(mbean, name, group, parameters)
    clear()
  }

  const clear = () => {
    setParameters('{}')
    onClose()
  }

  const manualTriggerButtons = [
    <Button key='fire' variant='danger' form='quartz-triggers-manual-modal-form' onClick={fireTrigger}>
      Fire now
    </Button>,
    <Button key='cancel' variant='link' onClick={clear}>
      Cancel
    </Button>,
  ]

  return (
    <Modal
      id='quartz-triggers-manual-modal'
      variant='medium'
      title={`Manually Fire Trigger: ${group}/${name}`}
      isOpen={isOpen}
      onClose={clear}
      actions={manualTriggerButtons}
    >
      <Form id='quartz-triggers-manual-modal-form' isHorizontal>
        <FormGroup label='Name' fieldId='quartz-triggers-manual-modal-form-name'>
          {name}
        </FormGroup>
        <FormGroup label='Group' fieldId='quartz-triggers-manual-modal-form-group'>
          {group}
        </FormGroup>
        <FormGroup
          label='Parameters'
          fieldId='quartz-triggers-manual-modal-form-parameters'
          helperText={['Parameters if any (', <code key={1}>java.util.Map</code>, ' in JSON syntax)']}
        >
          <TextArea
            id='quartz-triggers-manual-modal-form-parameters-input'
            aria-label='quartz triggers manual modal form parameters'
            resizeOrientation='vertical'
            value={parameters}
            onChange={value => setParameters(value)}
          />
        </FormGroup>
      </Form>
    </Modal>
  )
}
