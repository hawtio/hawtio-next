import { useUser } from '@hawtiosrc/auth/hooks'
import { DEFAULT_APP_NAME, DEFAULT_LOGIN_TITLE, useHawtconfig, usePlugins } from '@hawtiosrc/core'
import { hawtioLogo, background } from '@hawtiosrc/img'
import { ListItem, ListVariant, LoginFooterItem, LoginPage } from '@patternfly/react-core'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom-v5-compat'
import { HawtioNotification } from '../notification'
import { HawtioLoadingPage } from '../page/HawtioLoadingPage'
import { HawtioLoginForm } from './HawtioLoginForm'
import { log } from './globals'

export const HawtioLogin: React.FunctionComponent = () => {
  const navigate = useNavigate()

  const { isLogin, userLoaded } = useUser()
  const { hawtconfig, hawtconfigLoaded } = useHawtconfig()
  const { plugins, pluginsLoaded } = usePlugins()

  // navigate should be used in effect
  // otherwise "Cannot update a component (`BrowserRouter`) while rendering a different component" is thrown
  useEffect(() => {
    if (isLogin) {
      navigate('/')
    }
  }, [isLogin, navigate])

  if (!userLoaded || !hawtconfigLoaded || !pluginsLoaded) {
    log.debug('Loading:', 'user =', userLoaded, ', hawtconfig =', hawtconfigLoaded, ', pluginsLoaded =', pluginsLoaded)
    return <HawtioLoadingPage />
  }

  let loginForm = <HawtioLoginForm />
  const loginPlugins = plugins.filter(plugin => plugin.isLogin)
  log.debug('Discovered Login Plugins:', loginPlugins.length)

  if (loginPlugins.length > 0) {
    log.debug('Found Login Plugins ... Customising the Login Page')

    const loginPlugin = loginPlugins[0]
    const component = loginPlugin?.component
    if (component) {
      log.debug('Building with customised login form component')
      loginForm = React.createElement(component)
    }
  }

  const appLogo = hawtconfig.branding?.appLogoUrl ?? hawtioLogo
  const appName = hawtconfig.branding?.appName ?? DEFAULT_APP_NAME
  const description = hawtconfig.login?.description ?? ''
  const links = hawtconfig.login?.links ?? []
  const title = hawtconfig.login?.title ?? DEFAULT_LOGIN_TITLE

  const footerLinks = (
    <React.Fragment>
      {links.map((link, index) => (
        <ListItem key={`footer-link-${index}`}>
          <LoginFooterItem href={link.url}>{link.text}</LoginFooterItem>
        </ListItem>
      ))}
    </React.Fragment>
  )

  return (
    <LoginPage
      backgroundImgSrc={background}
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
