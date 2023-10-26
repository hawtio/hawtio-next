import { connectService } from '@hawtiosrc/plugins/shared'
import { Alert, Button, Form, FormAlert, FormGroup, Modal, TextInput } from '@patternfly/react-core'
import React, { useState } from 'react'

export const ConnectLogin: React.FunctionComponent = () => {
  const [isOpen, setIsOpen] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginFailed, setLoginFailed] = useState(false)

  const connectionName = connectService.getCurrentConnectionName()
  if (!connectionName) {
    return null
  }

  const handleLogin = () => {
    const login = async () => {
      const ok = await connectService.login(username, password)
      if (ok) {
        setLoginFailed(false)
        // Redirect to the original URL
        connectService.redirect()
      } else {
        setLoginFailed(true)
      }
    }
    login()
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const actions = [
    <Button key='login' variant='primary' onClick={handleLogin}>
      Log in
    </Button>,
    <Button key='cancel' variant='link' onClick={handleClose}>
      Cancel
    </Button>,
  ]

  const title = `Log in to ${connectionName}`

  return (
    <Modal variant='small' title={title} isOpen={isOpen} onClose={handleClose} actions={actions}>
      <Form id='connect-login-form' isHorizontal>
        {loginFailed && (
          <FormAlert>
            <Alert variant='danger' title='Incorrect username or password' isInline />
          </FormAlert>
        )}
        <FormGroup label='Username' isRequired fieldId='connect-login-form-username'>
          <TextInput
            isRequired
            id='connect-login-form-username'
            name='connect-login-form-username'
            value={username}
            onChange={value => setUsername(value)}
          />
        </FormGroup>
        <FormGroup label='Password' isRequired fieldId='connect-login-form-password'>
          <TextInput
            isRequired
            id='connect-login-form-password'
            name='connect-login-form-password'
            type='password'
            value={password}
            onChange={value => setPassword(value)}
          />
        </FormGroup>
      </Form>
    </Modal>
  )
}
