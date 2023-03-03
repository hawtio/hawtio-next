import { resetLocalStorage, retrieveValueFromLocalStorage, saveToLocalStorage } from '@hawtiosrc/util/localStorage'
import { Button, CardBody, Form, FormGroup, FormSection, Switch } from '@patternfly/react-core'
import React, { useState } from 'react'

export const HomePreferences: React.FunctionComponent = () => {
  const STORAGE_KEY_SHOW_VERTICAL_NAVIGATION_BY_DEFAULT = 'preferences.showVerticalNavigationByDefault'
  
  const showVerticalNavigationByDefaultInitialValueFromStorage =
    retrieveValueFromLocalStorage(STORAGE_KEY_SHOW_VERTICAL_NAVIGATION_BY_DEFAULT) !== null
      ? retrieveValueFromLocalStorage(STORAGE_KEY_SHOW_VERTICAL_NAVIGATION_BY_DEFAULT) === 'true'
      : true

  const [defaultVerticalNavState, setDefaultVerticalNavState] = 
    useState(showVerticalNavigationByDefaultInitialValueFromStorage)

  const reset = () => {
    setDefaultVerticalNavState(true);
    resetLocalStorage();
  }

  const UIForm = () => (
    <FormGroup label='Default vertical nav state' fieldId='ui-form-vertical-nav-switch'>
      <Switch
        label='Show vertical navigation'
        labelOff='Hide vertical navigation'
        isChecked={defaultVerticalNavState}
        onChange={value => {
          saveToLocalStorage(STORAGE_KEY_SHOW_VERTICAL_NAVIGATION_BY_DEFAULT, String(value));
          return setDefaultVerticalNavState(value)
        }}
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
