import { Button, CardBody, Form, FormGroup, FormSection, Switch } from '@patternfly/react-core'
import React, { useState } from 'react'

const HomePreferences: React.FunctionComponent = () => {
  const [defaultVerticalNavState, setDefaultVerticalNavState] = useState(true)

  const reset = () => {
    // TODO: impl
    console.log('TODO - Reset settings')
  }

  const UIForm = () => (
    <FormGroup
      label="Default vertical nav state"
      fieldId="ui-form-vertical-nav-switch">
      <Switch
        label="Show vertical navigation"
        labelOff="Hide vertical navigation"
        isChecked={defaultVerticalNavState}
        onChange={setDefaultVerticalNavState}
      />
    </FormGroup>
  )

  const ResetForm = () => (
    <FormGroup
      label="Reset settings"
      fieldId="reset-form-reset"
      helperText="Clear all custom settings stored in your browser's local storage and reset to defaults."
    >
      <Button variant="danger" onClick={reset}>
        Reset
      </Button>
    </FormGroup>
  )

  return (
    <CardBody>
      <Form isHorizontal>
        <FormSection title="UI" titleElement="h2">
          <UIForm />
        </FormSection>
        <FormSection title="Reset" titleElement="h2">
          <ResetForm />
        </FormSection>
      </Form>
    </CardBody>
  )
}

export default HomePreferences
