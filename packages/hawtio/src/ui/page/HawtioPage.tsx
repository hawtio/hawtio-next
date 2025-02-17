import { useUser } from '@hawtiosrc/auth/hooks'
import { useHawtconfig, usePlugins } from '@hawtiosrc/core'
import { HawtioHelp } from '@hawtiosrc/help/HawtioHelp'
import { background } from '@hawtiosrc/img'
import { PluginNodeSelectionContext, usePluginNodeSelected } from '@hawtiosrc/plugins'
import { HawtioPreferences } from '@hawtiosrc/preferences/HawtioPreferences'
import { preferencesService } from '@hawtiosrc/preferences/preferences-service'
import {
  BackgroundImage,
  EmptyState,
  EmptyStateIcon,
  Page,
  PageSection,
  EmptyStateHeader,
} from '@patternfly/react-core'
import { CubesIcon } from '@patternfly/react-icons'
import React, { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { HawtioNotification } from '../notification'
import { HawtioHeader } from './HawtioHeader'
import { HawtioLoadingPage } from './HawtioLoadingPage'
import { HawtioSidebar } from './HawtioSidebar'
import { PageContext } from './context'
import { log } from './globals'
import { sessionService, SessionMonitor } from '@hawtiosrc/ui/session'
import './HawtioPage.css'

export const HawtioPage: React.FunctionComponent = () => {
  const { username, isLogin, userLoaded, userLoading } = useUser()
  const { plugins, pluginsLoaded } = usePlugins()
  const { hawtconfig, hawtconfigLoaded } = useHawtconfig()
  const navigate = useNavigate()
  const { search } = useLocation()
  const { selectedNode, setSelectedNode } = usePluginNodeSelected()

  // navigate should be used in effect
  // otherwise "Cannot update a component (`BrowserRouter`) while rendering a different component" is thrown
  useEffect(() => {
    if (!isLogin && !userLoading) {
      navigate('login')
    }
  }, [isLogin, navigate, userLoading])

  if (!userLoaded || !pluginsLoaded || userLoading || !hawtconfigLoaded) {
    log.debug('Loading:', 'user =', userLoaded, ', plugins =', pluginsLoaded)
    return <HawtioLoadingPage />
  }

  log.debug(`Login state: username = ${username}, isLogin = ${isLogin}`)

  const defaultPlugin = plugins[0] ?? null
  let defaultPage = defaultPlugin ? <Navigate to={{ pathname: defaultPlugin.path, search }} /> : <HawtioHome />
  const tr = sessionStorage.getItem('connect-login-redirect')
  if (tr) {
    // this is required for OIDC, because we can't have redirect_uri with
    // wildcard on EntraID...
    // this session storage item is removed after successful login at connect/login page
    defaultPage = <Navigate to={{ pathname: tr, search }} />
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
        header={headerShown && <HawtioHeader />}
        sidebar={sideBarShown && <HawtioSidebar />}
        isManagedSidebar={sideBarShown}
        defaultManagedSidebarIsOpen={showVerticalNavByDefault}
        onClick={keepAlive}
      >
        {/* Provider for handling selected node shared between the plugins */}
        <PluginNodeSelectionContext.Provider value={{ selectedNode, setSelectedNode }}>
          <Routes>
            {/* plugins */}
            {plugins
              .filter(plugin => plugin.path != null && plugin.component != null)
              .map(plugin => (
                <Route key={plugin.id} path={`${plugin.path}/*`} element={React.createElement(plugin.component!)} />
              ))}
            <Route key='help' path='help/*' element={<HawtioHelp />} />
            <Route key='preferences' path='preferences/*' element={<HawtioPreferences />} />

            <Route key='index' path='index.html' element={<Navigate to='/' />} />
            <Route key='root' index element={defaultPage} />
          </Routes>
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
