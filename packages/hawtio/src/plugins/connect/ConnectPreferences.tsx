import { Button, CardBody, Form, FormGroup, FormSection, TextInput } from '@patternfly/react-core'
import React, { useState } from 'react'
import { RESET } from './connections'
import { useConnections } from './context'
import { log } from './globals'
import { jolokiaService } from '../connect/jolokia-service'
import { useNavigate } from 'react-router-dom'

export const ConnectPreferences: React.FunctionComponent = () => (
  <CardBody>
    <Form isHorizontal>
      <JolokiaForm />
      <ResetForm />
    </Form>
  </CardBody>
)

const JolokiaForm: React.FunctionComponent = () => {
  const navigate = useNavigate()

  const jolokiaStoredOptions = jolokiaService.loadJolokiaOptionsFromStorage()
  const [updateRate, setUpdateRate] = useState(jolokiaService.loadUpdateRate())
  const [maxDepth, setMaxDepth] = useState(jolokiaStoredOptions.maxDepth)
  const [maxCollectionSize, setMaxCollectionSize] = useState(jolokiaStoredOptions.maxCollectionSize)

  const onUpdateRateChanged = (updateRate: string) => {
    const intValue = parseInt(updateRate)

    if (intValue) {
      jolokiaService.saveUpdateRate(intValue)
      setUpdateRate(intValue)
    }
  }

  const onMaxDepthChanged = (maxDepth: string) => {
    const intValue = parseInt(maxDepth)

    if (intValue) {
      jolokiaService.saveMaxDepth(intValue)
      setMaxDepth(intValue)
    }
  }

  const onMaxCollectionSizeChanged = (maxCollectionSize: string) => {
    const intValue = parseInt(maxCollectionSize)

    if (intValue) {
      jolokiaService.saveMaxCollectionSize(intValue)
      setMaxCollectionSize(intValue)
    }
  }

  const applyJolokia = () => {
    // Page reload will apply currently stored preferences into Jolokia
    navigate(0)
  }

  return (
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
}

const ResetForm: React.FunctionComponent = () => {
  const { dispatch } = useConnections()
  const navigate = useNavigate()

  const reset = () => {
    log.debug('Clear saved connections')
    dispatch({ type: RESET })
    navigate(0)
  }

  return (
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
}
