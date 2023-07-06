import { useUser } from '@hawtiosrc/auth/hooks'
import { DEFAULT_APP_NAME, useHawtconfig } from '@hawtiosrc/core'
import { backgroundImages, hawtioLogo } from '@hawtiosrc/img'
import { ListItem, ListVariant, LoginFooterItem, LoginForm, LoginPage } from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HawtioNotification } from '../notification'
import { HawtioLoadingPage } from '../page/HawtioLoadingPage'
import { log } from './globals'
import { loginService } from './login-service'

export const HawtioLogin: React.FunctionComponent = () => {
  const navigate = useNavigate()

  const { isLogin, userLoaded } = useUser()
  const { hawtconfig, hawtconfigLoaded } = useHawtconfig()

  const [username, setUsername] = useState(loginService.getUser())
  const [isValidUsername, setIsValidUsername] = useState(true)
  const [password, setPassword] = useState('')
  const [isValidPassword, setIsValidPassword] = useState(true)
  const [rememberMe, setRememberMe] = useState(username !== '')
  const [loginFailed, setLoginFailed] = useState(false)

  useEffect(() => {
    if (isLogin) {
      navigate('/')
    }
  }, [isLogin, navigate])

  if (!userLoaded || !hawtconfigLoaded) {
    log.debug('Loading:', 'user =', userLoaded, ', hawtconfig =', hawtconfigLoaded)
    return <HawtioLoadingPage />
  }

  log.debug(`Login state: username = ${username}, isLogin = ${isLogin}`)

  const appLogo = hawtconfig.branding?.appLogoUrl || hawtioLogo
  const appName = hawtconfig.branding?.appName || DEFAULT_APP_NAME
  const description = hawtconfig.login?.description || ''
  const links = hawtconfig.login?.links || []

  const title = 'Log in to your account'
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

  const footerLinks = (
    <React.Fragment>
      {links.map((link, index) => (
        <ListItem key={`footer-link-${index}`}>
          <LoginFooterItem href={link.url}>{link.text}</LoginFooterItem>
        </ListItem>
      ))}
    </React.Fragment>
  )

  const loginForm = (
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

  return (
    <LoginPage
      backgroundImgSrc={backgroundImages}
      brandImgSrc={appLogo}
      brandImgAlt={appName}
      loginTitle={title}
      textContent={description}
      footerListItems={footerLinks}
      footerListVariants={ListVariant.inline}
    >
      {loginForm}
      <HawtioNotification />
    </LoginPage>
  )
}
