import { Button, CardBody, Form, FormGroup, FormSection, Switch } from '@patternfly/react-core'
import React from 'react'

type HomePreferencesProps = {
}

type HomePreferencesState = {
  defaultVerticalNavState: boolean
}

class HomePreferences extends React.Component<HomePreferencesProps, HomePreferencesState> {
  constructor(props: HomePreferencesProps) {
    super(props)
    this.state = {
      defaultVerticalNavState: true
    }
  }

  private onDefaultVerticalNavStateChange = (checked: boolean) =>
    this.setState({ defaultVerticalNavState: checked })

  private reset = () => {
    // TODO: impl
    console.log('TODO - Reset settings')
  }

  render() {
    const { defaultVerticalNavState } = this.state

    const UIForm = () => (
      <FormGroup
        label="Default vertical nav state"
        fieldId="ui-form-vertical-nav-switch">
        <Switch
          label="Show vertical navigation"
          labelOff="Hide vertical navigation"
          isChecked={defaultVerticalNavState}
          onChange={this.onDefaultVerticalNavStateChange}
        />
      </FormGroup>
    )

    const ResetForm = () => (
      <FormGroup
        label="Reset settings"
        fieldId="reset-form-reset"
        helperText="Clear all custom settings stored in your browser's local storage and reset to defaults."
      >
        <Button
          variant="danger"
          onClick={this.reset}
        >
          Reset settings
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
}

export default HomePreferences
