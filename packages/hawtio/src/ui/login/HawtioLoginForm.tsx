import { useUser } from '@hawtiosrc/auth/hooks'
import { LoginForm } from '@patternfly/react-core'
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

  log.debug(`Login state: username = ${username}, isLogin = ${isLogin}`)

  const rememberMeLabel = 'Remember username'
  const loginFailedMessage = 'Invalid login credentials'

  const reset = () => {
    setIsValidUsername(true)
    setIsValidPassword(true)
    setLoginFailed(false)
  }

  const doLogin = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
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
      return
    }

    loginService.login(username, password, rememberMe).then(result => {
      if (result) {
        navigate('/')
        // Reload page to force initialising Jolokia service
        navigate(0)
        return
      }
      // Login failed
      setLoginFailed(true)
      setIsValidUsername(false)
      setIsValidPassword(false)
    })
  }

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
    />
  )
}
