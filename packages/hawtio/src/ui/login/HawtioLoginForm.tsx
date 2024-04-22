import { useUser } from '@hawtiosrc/auth/hooks'
import { humanizeSeconds } from '@hawtiosrc/util/dates'
import { LoginForm, LoginFormProps } from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { log } from './globals'
import { loginService } from './login-service'

export const HawtioLoginForm: React.FunctionComponent = () => {
  const navigate = useNavigate()

  const { isLogin } = useUser()
  const [username, setUsername] = useState(loginService.getUser())
  const [isValidUsername, setIsValidUsername] = useState(true)
  const [password, setPassword] = useState('')
  const [isValidPassword, setIsValidPassword] = useState(true)
  const [rememberMe, setRememberMe] = useState(username !== '')
  const [loginFailed, setLoginFailed] = useState(false)
  const [loginFailedMessage, setLoginFailedMessage] = useState('')
  const [isEnabled, setIsEnabled] = useState(true)

  log.debug('Login state: username =', username, 'isLogin =', isLogin)

  const reset = () => {
    setIsValidUsername(true)
    setIsValidPassword(true)
    setLoginFailed(false)
    setLoginFailedMessage('')
    setIsEnabled(true)
  }

  const doLogin: LoginFormProps['onLoginButtonClick'] = event => {
    event.preventDefault()
    reset()
    let invalid = false
    if (username.trim() === '') {
      setIsValidUsername(false)
      setLoginFailed(true)
      invalid = true
    }
    if (password === '') {
      setIsValidPassword(false)
      setLoginFailed(true)
      invalid = true
    }
    if (invalid) {
      setLoginFailedMessage('Username/password should not be empty')
      return
    }

    loginService.login(username, password, rememberMe).then(result => {
      switch (result.type) {
        case 'success':
          navigate('/')
          // Reload page to force initialising Jolokia service
          navigate(0)
          break
        case 'failure':
          setLoginFailed(true)
          setLoginFailedMessage('Invalid login credentials')
          setIsValidUsername(false)
          setIsValidPassword(false)
          break
        case 'throttled': {
          const { retryAfter } = result
          setLoginFailed(true)
          setLoginFailedMessage(`Login attempt blocked. Retry after ${humanizeSeconds(retryAfter)}`)
          setIsValidUsername(false)
          setIsValidPassword(false)
          setIsEnabled(false)
          setTimeout(reset, retryAfter * 1000)
          break
        }
      }
    })
  }

  const rememberMeLabel = 'Remember username'

  return (
    <LoginForm
      showHelperText={loginFailed}
      helperText={loginFailedMessage}
      helperTextIcon={<ExclamationCircleIcon />}
      usernameLabel='Username'
      usernameValue={username}
      onChangeUsername={setUsername}
      isValidUsername={isValidUsername}
      passwordLabel='Password'
      passwordValue={password}
      onChangePassword={setPassword}
      isValidPassword={isValidPassword}
      rememberMeLabel={rememberMeLabel}
      isRememberMeChecked={rememberMe}
      onChangeRememberMe={() => setRememberMe(!rememberMe)}
      onLoginButtonClick={doLogin}
      loginButtonLabel='Log in'
      isLoginButtonDisabled={!isEnabled}
    />
  )
}
