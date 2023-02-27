import LocalStorageStatefulField from '@hawtiosrc/util/localStorageStatefulField'
import { Button, CardBody, Form, FormGroup, FormSection, Switch } from '@patternfly/react-core'
import React from 'react'

export const HomePreferences: React.FunctionComponent = () => {
  const VERTICAL_NAVIGATION = 'home_vertical_navigation'

  const LOCAL_STORAGE_FIELDS : Record<string, LocalStorageStatefulField<any>> = {
    [VERTICAL_NAVIGATION] : new LocalStorageStatefulField(
      VERTICAL_NAVIGATION,
      true,
      localStorageData => localStorageData === "true" 
    )
  }

  console.log(LOCAL_STORAGE_FIELDS)

  const reset = () => {
    Object.values(LOCAL_STORAGE_FIELDS).forEach(
      field => {
        field.reset()
      }
    )
  }

  const UIForm = () => (
    <FormGroup label='Default vertical nav state' fieldId='ui-form-vertical-nav-switch'>
      <Switch
        label='Show vertical navigation'
        labelOff='Hide vertical navigation'
        isChecked={LOCAL_STORAGE_FIELDS[VERTICAL_NAVIGATION].currentStatefulValue}
        onChange={LOCAL_STORAGE_FIELDS[VERTICAL_NAVIGATION].updateSavingToLocalStorageFunction()}
      />
    </FormGroup>
  )

  const ResetForm = () => (
    <FormGroup
      label='Reset settings'
      fieldId='reset-form-reset'
      helperText="Clear all custom settings stored in your browser's local storage and reset to defaults."
    >
      <Button variant='danger' onClick={reset}>
        Reset
      </Button>
    </FormGroup>
  )

  return (
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
}
