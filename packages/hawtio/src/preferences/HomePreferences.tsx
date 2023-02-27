import { Button, CardBody, Form, FormGroup, FormSection, Switch } from '@patternfly/react-core'
import React, { useState } from 'react'
import { string } from 'superstruct'
import { log } from './globals'

type LocalStorageFieldData<T> = {
  localStorageKey: string,
  defaultValue: T,
  updateFunction: React.Dispatch<React.SetStateAction<T>>
}

export const HomePreferences: React.FunctionComponent = () => {

  const LOCAL_STORAGE_VERTICAL_NAVIGATION = "local_storage_vertical_navigation"
  const DEFAULT_VALUE_VERTICAL_NAVIGATION = true;
  
  const VERTICAL_NAVIGATION_INITIAL_VALUE : boolean = 
    localStorage.getItem(LOCAL_STORAGE_VERTICAL_NAVIGATION) !== null
    ? localStorage.getItem(LOCAL_STORAGE_VERTICAL_NAVIGATION) === "true"
    : DEFAULT_VALUE_VERTICAL_NAVIGATION;

  const [defaultVerticalNavState, setDefaultVerticalNavState] = useState(VERTICAL_NAVIGATION_INITIAL_VALUE)

  const VERTICAL_NAVIGATION_FIELD_PARAMETERS : LocalStorageFieldData<boolean> = {
    localStorageKey: LOCAL_STORAGE_VERTICAL_NAVIGATION,
    defaultValue: true,
    updateFunction: setDefaultVerticalNavState
  }

  const FIELDS_TO_RESET = [VERTICAL_NAVIGATION_FIELD_PARAMETERS]

  const reset = () => {
    FIELDS_TO_RESET.forEach(
      field => {
        localStorage.removeItem(field.localStorageKey)
        field.updateFunction(field.defaultValue)
      }
    )
  }

  const savingToLocalStorage = <T,>(keyToSave : string, updateFunction : React.Dispatch<React.SetStateAction<T>>) 
    : React.Dispatch<React.SetStateAction<T>> => {
    return (value) => {
      localStorage.setItem(keyToSave, String(value))
      return updateFunction(value)
    };
  }

  const UIForm = () => (
    <FormGroup label='Default vertical nav state' fieldId='ui-form-vertical-nav-switch'>
      <Switch
        label='Show vertical navigation'
        labelOff='Hide vertical navigation'
        isChecked={defaultVerticalNavState}
        onChange={savingToLocalStorage(LOCAL_STORAGE_VERTICAL_NAVIGATION, setDefaultVerticalNavState)}
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
