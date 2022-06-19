import { Button, CardBody, Form, FormGroup, FormSection, FormSelect, FormSelectOption, InputGroup, TextInput } from '@patternfly/react-core'
import PlusIcon from '@patternfly/react-icons/dist/esm/icons/plus-icon'
import TrashIcon from '@patternfly/react-icons/dist/esm/icons/trash-icon'
import React from 'react'

type LogsPreferencesProps = {
}

type LogsPreferencesState = {
  logBuffer: string,
  globalLogLevel: string,
  childLoggers: {},

}

class LogsPreferences extends React.Component<LogsPreferencesProps, LogsPreferencesState> {
  constructor(props: LogsPreferencesProps) {
    super(props)
    this.state = {
      logBuffer: '100',
      globalLogLevel: 'INFO',
      childLoggers: {},
    }
  }

  private onLogBufferChanged = (logBuffer: string) =>
    this.setState({ logBuffer: logBuffer })

  private onGlobalLogLevelChanged = (globalLogLevel: string) => {
    console.log('selected:', globalLogLevel)
    this.setState({ globalLogLevel: globalLogLevel })
  }

  render() {
    const { logBuffer, globalLogLevel } = this.state

    const LogBufferForm = () => (
      <FormGroup
        label="Log buffer"
        fieldId="logs-form-log-buffer"
        helperText="Number of log statements to keep in the console"
      >
        <TextInput
          id="logs-form-log-buffer-input"
          type="number"
          value={logBuffer}
          onChange={this.onLogBufferChanged}
        />
      </FormGroup>
    )

    const logLevels = [
      <FormSelectOption key={0} label="OFF" value="OFF" />,
      <FormSelectOption key={1} label="ERROR" value="ERROR" />,
      <FormSelectOption key={2} label="WARN" value="WARN" />,
      <FormSelectOption key={3} label="INFO" value="INFO" />,
      <FormSelectOption key={4} label="DEBUG" value="DEBUG" />,
    ]

    const GlobalLogLevelForm = () => (
      <FormGroup
        label="Log level"
        fieldId="logs-form-global-log-level"
      >
        <FormSelect
          id="logs-form-global-log-level-select"
          value={globalLogLevel}
          onChange={this.onGlobalLogLevelChanged}
        >
          {logLevels}
        </FormSelect>
      </FormGroup>
    )

    const childLoggers = [
      <FormSelectOption key={0} label="---" />,
      <FormSelectOption key={1} label="hawtio-core" value="hawtio-core" />,
    ]

    const ChildLoggersForm = () => (
      <FormGroup
        label="Add logger"
        fieldId="logs-form-child-loggers"
      >
        <InputGroup>
          <FormSelect
            id="logs-form-child-loggers-select"
          >
            {childLoggers}
          </FormSelect>
          <Button variant="control">
            <PlusIcon />
          </Button>
        </InputGroup>
      </FormGroup>
    )

    const childLoggerForms = [
      <FormGroup
        label="hawtio-core"
        fieldId="logs-form-child-logger-hawtio-core"
      >
        <InputGroup>
          <FormSelect
            id="logs-form-child-logger-hawtio-core-select"
            value={"INFO"}
            onChange={value => { console.log('selected:', value) }}
          >
            {logLevels}
          </FormSelect>
          <Button variant="control">
            <TrashIcon />
          </Button>
        </InputGroup>
      </FormGroup>
    ]

    return (
      <CardBody>
        <Form isHorizontal>
          <FormSection title="Global" titleElement="h2">
            <LogBufferForm />
            <GlobalLogLevelForm />
          </FormSection>
          <FormSection title="Child loggers" titleElement="h2">
            <ChildLoggersForm />
            {childLoggerForms}
          </FormSection>
        </Form>
      </CardBody>
    )
  }
}

export default LogsPreferences
