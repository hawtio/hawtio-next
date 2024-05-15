import { Connection, ConnectionTestResult, connectService } from '@hawtiosrc/plugins/shared/connect-service'
import { isBlank } from '@hawtiosrc/util/strings'
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  HelperText,
  HelperTextItem,
  Modal,
  ModalVariant,
  Switch,
  TextInput,
} from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import React, { useContext, useState } from 'react'
import { ADD, UPDATE } from '../connections'
import { ConnectContext } from '../context'

type Validation = {
  text: string
  validated: 'success' | 'warning' | 'error' | 'default'
}

type Validations = {
  name: Validation
  host: Validation
  port: Validation
  test: ConnectionTestResult | null
}

const emptyResult: Validations = {
  name: { text: '', validated: 'default' },
  host: { text: '', validated: 'default' },
  port: { text: '', validated: 'default' },
  test: null,
} as const

export const ConnectionModal: React.FunctionComponent<{
  mode: 'add' | 'edit'
  isOpen: boolean
  onClose: () => void
  input: Connection
}> = ({ mode, isOpen, onClose, input }) => {
  const { connections, dispatch } = useContext(ConnectContext)

  const [connection, setConnection] = useState(input)
  const [validations, setValidations] = useState(emptyResult)

  const test = async () => {
    if (!validate()) {
      return
    }

    try {
      const result = await connectService.testConnection(connection)
      setValidations({ ...emptyResult, test: result })
    } catch (error) {
      setValidations({ ...emptyResult, test: { status: 'not-reachable', message: '' + error } })
    }
  }

  const validate = () => {
    const result = { ...emptyResult }
    const { id: cid, name, host, port } = connection
    let valid = true

    // Name
    if (isBlank(name)) {
      result.name = {
        text: 'Please fill out this field',
        validated: 'error',
      }
      valid = false
    } else if (name !== input.name) {
      for (const id in connections) {
        if (id !== cid && connections[id]?.name === name) {
          result.name = {
            text: `Connection name '${connection.name.trim()}' is already in use`,
            validated: 'error',
          }
          valid = false
          break
        }
      }
    }

    // Host
    if (isBlank(host)) {
      result.host = {
        text: 'Please fill out this field',
        validated: 'error',
      }
      valid = false
    } else if (host.indexOf(':') !== -1) {
      result.host = {
        // TODO: IPv6
        text: "Invalid character ':'",
        validated: 'error',
      }
      valid = false
    }

    // Port
    if (port === null || port < 0 || port > 65535) {
      result.port = {
        text: 'Please enter a number from 0 to 65535',
        validated: 'error',
      }
      valid = false
    }

    if (!valid) {
      setValidations(result)
    }
    return valid
  }

  const save = () => {
    if (!validate()) {
      return
    }

    switch (mode) {
      case 'add':
        dispatch({ type: ADD, connection })
        setConnection(input)
        break
      case 'edit':
        dispatch({ type: UPDATE, id: input.id, connection })
        setConnection(connection)
        break
    }
    setValidations(emptyResult)
    onClose()
  }

  const clear = () => {
    setConnection(input)
    setValidations(emptyResult)
    onClose()
  }

  const modalTitle = (mode === 'add' ? 'Add' : 'Edit') + ' Connection'

  return (
    <Modal
      variant={ModalVariant.medium}
      title={modalTitle}
      isOpen={isOpen}
      onClose={clear}
      actions={[
        <Button key='save' variant={ButtonVariant.primary} form='connection-form' onClick={save}>
          {mode === 'add' ? 'Add' : 'Save'}
        </Button>,
        <Button key='cancel' variant={ButtonVariant.link} onClick={clear}>
          Cancel
        </Button>,
      ]}
    >
      <Form id='connection-form' isHorizontal>
        <FormGroup
          label='Name'
          isRequired
          fieldId='connection-form-name'
          helperTextInvalid={validations.name.text}
          helperTextInvalidIcon={<ExclamationCircleIcon />}
          validated={validations.name.validated}
        >
          <TextInput
            isRequired
            id='connection-form-name'
            name='connection-form-name'
            value={connection.name}
            onChange={name => setConnection({ ...connection, name })}
            validated={validations.name.validated}
          />
        </FormGroup>
        <FormGroup label='Scheme' isRequired fieldId='connection-form-scheme'>
          <Switch
            id='connection-form-scheme'
            label='HTTPS'
            labelOff='HTTP'
            isChecked={connection.scheme === 'https'}
            onChange={https => setConnection({ ...connection, scheme: https ? 'https' : 'http' })}
          />
        </FormGroup>
        <FormGroup
          label='Host'
          isRequired
          fieldId='connection-form-host'
          helperTextInvalid={validations.host.text}
          helperTextInvalidIcon={<ExclamationCircleIcon />}
          validated={validations.host.validated}
        >
          <TextInput
            isRequired
            id='connection-form-host'
            name='connection-form-host'
            value={connection.host}
            onChange={host => setConnection({ ...connection, host })}
            validated={validations.host.validated}
          />
        </FormGroup>
        <FormGroup
          label='Port'
          isRequired
          fieldId='connection-form-port'
          helperTextInvalid={validations.port.text}
          helperTextInvalidIcon={<ExclamationCircleIcon />}
          validated={validations.port.validated}
        >
          <TextInput
            isRequired
            type='number'
            id='connection-form-port'
            name='connection-form-port'
            value={connection.port}
            onChange={port => setConnection({ ...connection, port: parseInt(port) })}
            validated={validations.port.validated}
          />
        </FormGroup>
        <FormGroup label='Path' isRequired fieldId='connection-form-path'>
          <TextInput
            isRequired
            id='connection-form-path'
            name='connection-form-path'
            value={connection.path}
            onChange={path => setConnection({ ...connection, path })}
          />
        </FormGroup>
        <ActionGroup>
          <Button variant={ButtonVariant.secondary} onClick={test} isSmall>
            Test connection
          </Button>
          {validations.test ? (
            <HelperText>
              <HelperTextItem variant={validations.test.status === 'reachable' ? 'success' : 'error'} hasIcon>
                {validations.test.message}
              </HelperTextItem>
            </HelperText>
          ) : null}
        </ActionGroup>
      </Form>
    </Modal>
  )
}
