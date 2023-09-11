import { Button, Form, FormGroup, Modal, TextArea } from '@patternfly/react-core'
import React, { useContext, useState } from 'react'
import { QuartzContext } from '../context'
import { log } from '../globals'
import { Trigger, quartzService } from '../quartz-service'

export const TriggersManualModal: React.FunctionComponent<{
  isOpen: boolean
  onClose: () => void
  input: Trigger
}> = ({ isOpen, onClose, input }) => {
  const { selectedNode } = useContext(QuartzContext)
  const [parameters, setParameters] = useState('{}')

  if (!selectedNode || !selectedNode.objectName) {
    return null
  }

  const { objectName } = selectedNode
  const { name, group } = input

  const fireTrigger = () => {
    log.info('Manually fire trigger:', objectName, input, parameters)
    quartzService.triggerJob(objectName, name, group, parameters)
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
