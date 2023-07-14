import { jolokiaService } from '@hawtiosrc/plugins/shared/jolokia-service'
import { TooltipHelpIcon } from '@hawtiosrc/ui/icons'
import {
  Alert,
  Button,
  CardBody,
  Checkbox,
  Form,
  FormGroup,
  FormGroupProps,
  FormSection,
  Modal,
  ModalVariant,
  TextInput,
} from '@patternfly/react-core'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RESET } from './connections'
import { useConnections } from './context'
import { log } from './globals'

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

  const jolokiaStoredOptions = jolokiaService.loadJolokiaStoredOptions()
  const [updateRate, setUpdateRate] = useState(jolokiaService.loadUpdateRate())
  const [updateRateValidated, setUpdateRateValidated] = useState<FormGroupProps['validated']>('default')
  const [updateRateInvalidText, setUpdateRateInvalidText] = useState('')
  const [maxDepth, setMaxDepth] = useState(jolokiaStoredOptions.maxDepth)
  const [maxDepthValidated, setMaxDepthValidated] = useState<FormGroupProps['validated']>('default')
  const [maxDepthInvalidText, setMaxDepthInvalidText] = useState('')
  const [maxCollectionSize, setMaxCollectionSize] = useState(jolokiaStoredOptions.maxCollectionSize)
  const [maxCollectionSizeValidated, setMaxCollectionSizeValidated] = useState<FormGroupProps['validated']>('default')
  const [maxCollectionSizeInvalidText, setMaxCollectionSizeInvalidText] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(jolokiaService.loadAutoRefresh())

  const onUpdateRateChanged = (updateRate: string) => {
    const intValue = parseInt(updateRate)
    if (!intValue) {
      setUpdateRateValidated('error')
      setUpdateRateInvalidText('Must be a number')
      return
    }
    if (intValue <= 0) {
      setUpdateRateValidated('error')
      setUpdateRateInvalidText('Must be greater than 0')
      return
    }

    setUpdateRate(intValue)
    setUpdateRateValidated('success')
  }

  const onMaxDepthChanged = (maxDepth: string) => {
    const intValue = parseInt(maxDepth)
    if (!intValue) {
      setMaxDepthValidated('error')
      setMaxDepthInvalidText('Must be a number')
      return
    }
    if (intValue <= 0) {
      setMaxDepthValidated('error')
      setMaxDepthInvalidText('Must be greater than 0')
      return
    }

    setMaxDepth(intValue)
    setMaxDepthValidated('success')
  }

  const onMaxCollectionSizeChanged = (maxCollectionSize: string) => {
    const intValue = parseInt(maxCollectionSize)
    if (!intValue) {
      setMaxCollectionSizeValidated('error')
      setMaxCollectionSizeInvalidText('Must be a number')
      return
    }
    if (intValue <= 0) {
      setMaxCollectionSizeValidated('error')
      setMaxCollectionSizeInvalidText('Must be greater than 0')
      return
    }

    setMaxCollectionSize(intValue)
    setMaxCollectionSizeValidated('success')
  }

  const onAutoRefreshChanged = (autoRefresh: boolean) => {
    setAutoRefresh(autoRefresh)
  }

  const applyJolokia = () => {
    jolokiaService.saveUpdateRate(updateRate)
    jolokiaService.saveJolokiaStoredOptions({ maxDepth, maxCollectionSize })
    jolokiaService.saveAutoRefresh(autoRefresh)

    // Page reload will apply currently stored preferences into Jolokia
    navigate(0)
  }

  return (
    <FormSection title='Jolokia' titleElement='h2'>
      <FormGroup
        label='Update rate'
        fieldId='jolokia-form-update-rate'
        validated={updateRateValidated}
        helperTextInvalid={updateRateInvalidText}
        labelIcon={<TooltipHelpIcon tooltip='The period between polls to jolokia to fetch JMX data' />}
      >
        <TextInput
          id='jolokia-form-update-rate-input'
          type='number'
          value={updateRate}
          validated={updateRateValidated}
          onChange={onUpdateRateChanged}
        />
      </FormGroup>
      <FormGroup
        label='Max depth'
        fieldId='jolokia-form-max-depth'
        validated={maxDepthValidated}
        helperTextInvalid={maxDepthInvalidText}
        labelIcon={
          <TooltipHelpIcon tooltip='The number of levels jolokia will marshal an object to json on the server side before returning' />
        }
      >
        <TextInput
          id='jolokia-form-max-depth-input'
          type='number'
          value={maxDepth}
          validated={maxDepthValidated}
          onChange={onMaxDepthChanged}
        />
      </FormGroup>
      <FormGroup
        label='Max collection size'
        fieldId='jolokia-form-max-collection-size'
        validated={maxCollectionSizeValidated}
        helperTextInvalid={maxCollectionSizeInvalidText}
        labelIcon={
          <TooltipHelpIcon tooltip='The maximum number of elements in an array that jolokia will marshal in a response' />
        }
      >
        <TextInput
          id='jolokia-form-max-collection-size-input'
          type='number'
          value={maxCollectionSize}
          validated={maxCollectionSizeValidated}
          onChange={onMaxCollectionSizeChanged}
        />
      </FormGroup>
      <FormGroup
        label='Auto refresh'
        fieldId='jolokia-form-auto-refresh'
        labelIcon={
          <TooltipHelpIcon tooltip='Wether the page should refresh whenever it detects an update on a plugin' />
        }
      >
        <Checkbox id='jolokia-form-auto-refresh-input' isChecked={autoRefresh} onChange={onAutoRefreshChanged} />
      </FormGroup>
      <FormGroup fieldId='jolokia-form-apply' helperText='Restart Hawtio with the new values in effect.'>
        <Button onClick={applyJolokia}>Apply</Button>
      </FormGroup>
    </FormSection>
  )
}

const ResetForm: React.FunctionComponent = () => {
  const { dispatch } = useConnections()
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isClearSuccess, setIsClearSuccess] = useState(false)

  const clear = () => {
    log.debug('Clear saved connections')
    dispatch({ type: RESET })
    setIsClearSuccess(true)
    setIsConfirmModalOpen(false)
  }

  const confirmClear = () => {
    setIsConfirmModalOpen(!isConfirmModalOpen)
  }

  const ConfirmClearModal = () => (
    <Modal
      variant={ModalVariant.small}
      title='Clear saved connections'
      titleIconVariant='danger'
      isOpen={isConfirmModalOpen}
      onClose={confirmClear}
      actions={[
        <Button key='reset' variant='danger' onClick={clear}>
          Clear
        </Button>,
        <Button key='cancel' variant='link' onClick={confirmClear}>
          Cancel
        </Button>,
      ]}
    >
      You are about to clear all saved connection settings.
    </Modal>
  )

  return (
    <FormSection title='Reset' titleElement='h2'>
      <FormGroup
        label='Clear saved connections'
        fieldId='reset-form-clear'
        helperText='Clear all saved connection settings stored in your browser local storage.'
      >
        <Button variant='danger' onClick={confirmClear}>
          Clear
        </Button>
        <ConfirmClearModal />
      </FormGroup>
      {isClearSuccess && <Alert variant='success' isInline title='Connections cleared successfully!' />}
    </FormSection>
  )
}
