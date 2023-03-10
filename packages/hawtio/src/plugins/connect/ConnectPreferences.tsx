import { Button, CardBody, Form, FormGroup, FormSection, TextInput } from '@patternfly/react-core'
import React, { useState } from 'react'
import { RESET } from './connections'
import { useConnections } from './context'
import { log } from './globals'
import { preferencesService } from '../../preferences/preferences-service'
import { useNavigate } from 'react-router-dom'

const DEFAULT_UPDATE_RATE = 5000
const DEFAULT_MAX_DEPTH = 7
const DEFAULT_MAX_COLLECTION_SIZE = 50000

export const ConnectPreferences: React.FunctionComponent = () => {
  const { dispatch } = useConnections()
  const navigate = useNavigate();

  const [updateRate, setUpdateRate] = useState(preferencesService.getJolokiaUpdateRate())
  const [maxDepth, setMaxDepth] = useState(preferencesService.getJolokiaMaxDepth())
  const [maxCollectionSize, setMaxCollectionSize] = useState(preferencesService.getJolokiaMaxCollectionSize())

  const onUpdateRateChanged = (updateRate: string) => {
    const intValue = parseInt(updateRate)

    if(intValue) {
      preferencesService.saveJolokiaUpdateRate(intValue)
      setUpdateRate(intValue)
    }
  }

  const onMaxDepthChanged = (maxDepth: string) => {
    const intValue = parseInt(maxDepth)

    if(intValue) {
      preferencesService.saveJolokiaMaxDepth(intValue)
      setMaxDepth(intValue)
    }
  }

  const onMaxCollectionSizeChanged = (maxCollectionSize: string) => {
    const intValue = parseInt(maxCollectionSize)

    if(intValue) {
      preferencesService.saveJolokiaMaxCollectionSize(intValue)
      setMaxCollectionSize(intValue)
    }
  }
  
  const applyJolokia = () => {
    //Page reload will apply currently stored preferences into jolokla
    navigate(0)
  }

  const reset = () => {
    //Page reload after settings have been reset will default jolokla settings to default
    preferencesService.reset();
    navigate(0);
    log.debug('Clear saved connections')
    dispatch({ type: RESET })
  }

  const JolokiaForm = () => (
    <FormSection title='Jolokia' titleElement='h2'>
      <FormGroup label='Update rate' fieldId='jolokia-form-update-rate'>
        <TextInput
          id='jolokia-form-update-rate-input'
          type='number'
          value={updateRate}
          onChange={onUpdateRateChanged}
        />
      </FormGroup>
      <FormGroup label='Max depth' fieldId='jolokia-form-max-depth'>
        <TextInput id='jolokia-form-max-depth-input' type='number' value={maxDepth} onChange={onMaxDepthChanged} />
      </FormGroup>
      <FormGroup label='Max collection size' fieldId='jolokia-form-max-collection-size'>
        <TextInput
          id='jolokia-form-max-collection-size-input'
          type='number'
          value={maxCollectionSize}
          onChange={onMaxCollectionSizeChanged}
        />
      </FormGroup>
      <FormGroup fieldId='jolokia-form-apply' helperText='Restart Hawtio with the new values in effect.'>
        <Button onClick={applyJolokia}>Apply</Button>
      </FormGroup>
    </FormSection>
  )

  const ResetForm = () => (
    <FormSection title='Reset' titleElement='h2'>
      <FormGroup
        label='Clear saved connections'
        fieldId='reset-form-clear'
        helperText="Clear all saved connection settings stored in your browser's local storage."
      >
        <Button variant='danger' onClick={reset}>
          Clear
        </Button>
      </FormGroup>
    </FormSection>
  )

  return (
    <CardBody>
      <Form isHorizontal>
        <JolokiaForm />
        <ResetForm />
      </Form>
    </CardBody>
  )
}
