import {
  Alert,
  Button,
  CardBody,
  Form,
  FormGroup,
  FormSection,
  Modal,
  ModalVariant,
  Switch,
} from '@patternfly/react-core'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { preferencesService } from './preferences-service'

export const HomePreferences: React.FunctionComponent = () => (
  <CardBody>
    <Form isHorizontal>
      <FormSection title='UI' titleElement='h2'>
        <UIForm />
      </FormSection>
      <FormSection title='Reset' titleElement='h2'>
        <ResetForm />
      </FormSection>
    </Form>
  </CardBody>
)

const UIForm: React.FunctionComponent = () => {
  const [showVerticalNav, setShowVerticalNav] = useState(preferencesService.isShowVerticalNavByDefault())

  const handleShowVerticalNavChange = (value: boolean) => {
    setShowVerticalNav(value)
    preferencesService.saveShowVerticalNavByDefault(value)
  }

  return (
    <FormGroup label='Default vertical nav state' fieldId='ui-form-vertical-nav-switch'>
      <Switch
        label='Show vertical navigation'
        labelOff='Hide vertical navigation'
        isChecked={showVerticalNav}
        onChange={handleShowVerticalNavChange}
      />
    </FormGroup>
  )
}

const ResetForm: React.FunctionComponent = () => {
  const navigate = useNavigate()
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false)

  const reset = () => {
    preferencesService.reset()
    // Reload page after reset
    navigate(0)
  }

  const confirmReset = () => {
    setIsConfirmResetOpen(!isConfirmResetOpen)
  }

  const ConfirmResetModal = () => (
    <Modal
      variant={ModalVariant.small}
      title='Reset settings'
      titleIconVariant='danger'
      isOpen={isConfirmResetOpen}
      onClose={confirmReset}
      actions={[
        <Button key='reset' variant='danger' onClick={reset}>
          Reset
        </Button>,
        <Button key='cancel' variant='link' onClick={confirmReset}>
          Cancel
        </Button>,
      ]}
    >
      You are about to reset all the Hawtio settings.
    </Modal>
  )

  const resetSuccess = preferencesService.isResetSuccess()

  return (
    <React.Fragment>
      <FormGroup
        label='Reset settings'
        fieldId='reset-form-reset'
        helperText="Clear all custom settings stored in your browser's local storage and reset to defaults."
      >
        <Button variant='danger' onClick={confirmReset}>
          Reset
        </Button>
        <ConfirmResetModal />
      </FormGroup>
      {resetSuccess && <Alert variant='success' isInline title='Settings reset successfully!' />}
    </React.Fragment>
  )
}
