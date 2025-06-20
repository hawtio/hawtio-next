import { useUser } from '@hawtiosrc/auth/hooks'
import { hawtio, useHawtconfig, usePlugins } from '@hawtiosrc/core'
import { HawtioHelp } from '@hawtiosrc/help/ui'
import { background } from '@hawtiosrc/img'
import { PluginNodeSelectionContext, usePluginNodeSelected } from '@hawtiosrc/plugins'
import { HawtioPreferences } from '@hawtiosrc/preferences/ui'
import { preferencesService } from '@hawtiosrc/preferences/preferences-service'
import {
  BackgroundImage,
  EmptyState,
  EmptyStateIcon,
  Page,
  PageSection,
  EmptyStateHeader,
} from '@patternfly/react-core'
import { CubesIcon } from '@patternfly/react-icons/dist/esm/icons/cubes-icon'
import React, { useEffect } from 'react'
import { Redirect, Route, Switch, useLocation, useHistory } from 'react-router-dom' // includes NavLink
import { HawtioNotification } from '@hawtiosrc/ui/notification'
import { HawtioHeader } from './HawtioHeader'
import { HawtioLoadingPage } from './HawtioLoadingPage'
import { HawtioSidebar } from './HawtioSidebar'
import { PageContext } from './context'
import { log } from './globals'
import { sessionService, SessionMonitor } from '@hawtiosrc/ui/session'
import { HELP, INDEX, INDEX_KEY, PREFERENCES, ROOT, WILDCARD } from '@hawtiosrc/RouteConstants'
import './HawtioPage.css'

/**
 * One of two _main_ components to be displayed in `<Hawtio>` component. It is displayed when user is logged in.
 */
export const HawtioPage: React.FunctionComponent = () => {
  const { username, isLogin, userLoaded, loginMethod } = useUser()
  const { plugins, pluginsLoaded } = usePlugins()
  const { hawtconfig, hawtconfigLoaded } = useHawtconfig()
  const navigate = useHistory()
  const { search } = useLocation()
  const { selectedNode, setSelectedNode } = usePluginNodeSelected()

  // navigate should be used in effect
  // otherwise "Cannot update a component (`BrowserRouter`) while rendering a different component" is thrown
  useEffect(() => {
    if (!isLogin && userLoaded) {
      navigate.push('login')
    }
  }, [isLogin, userLoaded, navigate])

  if (!isLogin || !userLoaded || !pluginsLoaded || !hawtconfigLoaded) {
    return <HawtioLoadingPage />
  }

  log.debug(`Login state: username = ${username}, isLogin = ${isLogin}`)

  const defaultPlugin = plugins[0] ?? null
  let defaultPage = defaultPlugin ? (
    <Redirect to={{ pathname: hawtio.fullPath(defaultPlugin.path!), search }} />
  ) : (
    <HawtioHome />
  )
  const tr = sessionStorage.getItem('connect-login-redirect')
  if (tr) {
    // this is required for OIDC, because we can't have redirect_uri with
    // wildcard on EntraID...
    // this session storage item is removed after successful login at connect/login page
    defaultPage = <Redirect to={{ pathname: tr, search }} />
  }

  const showVerticalNavByDefault = preferencesService.isShowVerticalNavByDefault()

  const keepAlive = (): void => {
    sessionService.userActivity()
  }

  // If not defined then assume the default of shown
  const headerShown = hawtconfig.appearance?.showHeader ?? true
  const sideBarShown = hawtconfig.appearance?.showSideBar ?? true

  return (
    <PageContext.Provider value={{ username, plugins }}>
      <BackgroundImage src={background} />
      <Page
        id='hawtio-main-page'
        header={headerShown && <HawtioHeader loginMethod={loginMethod} />}
        sidebar={sideBarShown && <HawtioSidebar />}
        isManagedSidebar={sideBarShown}
        defaultManagedSidebarIsOpen={showVerticalNavByDefault}
        onClick={keepAlive}
      >
        {/* Provider for handling selected node shared between the plugins */}
        <PluginNodeSelectionContext.Provider value={{ selectedNode, setSelectedNode }}>
          <Switch>
            {/* plugins */}
            {plugins
              .filter(plugin => plugin.path != null && plugin.component != null)
              .map(plugin => (
                <Route key={plugin.id} path={`${hawtio.fullPath(plugin.path!, WILDCARD)}`}>
                  {React.createElement(plugin.component!)}
                </Route>
              ))}
            <Route key={HELP} path={hawtio.fullPath(HELP, WILDCARD)}>
              <HawtioHelp />
            </Route>
            <Route key={PREFERENCES} path={hawtio.fullPath(PREFERENCES, WILDCARD)}>
              <HawtioPreferences />
            </Route>
            <Route key={INDEX_KEY} path={hawtio.fullPath('index.html')}>
              <Redirect to={hawtio.fullPath(INDEX)} />
            </Route>
            <Route key={ROOT} exact path={`${hawtio.fullPath(INDEX)}`}>
              {defaultPage}
            </Route>
          </Switch>
        </PluginNodeSelectionContext.Provider>
        <HawtioNotification />
        <SessionMonitor />
      </Page>
    </PageContext.Provider>
  )
}

const HawtioHome: React.FunctionComponent = () => (
  <PageSection variant='light'>
    <EmptyState variant='full'>
      <EmptyStateHeader titleText='Hawtio' icon={<EmptyStateIcon icon={CubesIcon} />} headingLevel='h1' />
    </EmptyState>
  </PageSection>
)
