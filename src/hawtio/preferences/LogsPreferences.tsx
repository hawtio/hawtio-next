import { Button, CardBody, Form, FormGroup, FormSection, FormSelect, FormSelectOption, InputGroup, TextInput } from '@patternfly/react-core'
import { PlusIcon, TrashIcon } from '@patternfly/react-icons'
import React, { useState } from 'react'

export const LogsPreferences: React.FunctionComponent = () => {
  const [logBuffer, setLogBuffer] = useState('100')
  const [globalLogLevel, setGlobalLogLevel] = useState('INFO')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [childLoggers, setChildLoggers] = useState({})

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
        onChange={setLogBuffer}
      />
    </FormGroup>
  )

  const logLevelOptions = [
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
        onChange={setGlobalLogLevel}
      >
        {logLevelOptions}
      </FormSelect>
    </FormGroup>
  )

  const childLoggerOptions = [
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
          {childLoggerOptions}
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
          {logLevelOptions}
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
