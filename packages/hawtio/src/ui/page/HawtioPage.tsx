import { useUser } from '@hawtiosrc/auth/hooks'
import { usePlugins } from '@hawtiosrc/core'
import { HawtioHelp } from '@hawtiosrc/help/HawtioHelp'
import { backgroundImages } from '@hawtiosrc/img'
import { PluginNodeSelectionContext, usePluginNodeSelected } from '@hawtiosrc/plugins'
import { HawtioPreferences } from '@hawtiosrc/preferences/HawtioPreferences'
import { preferencesService } from '@hawtiosrc/preferences/preferences-service'
import { BackgroundImage, EmptyState, EmptyStateIcon, Page, PageSection, Title } from '@patternfly/react-core'
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

  if (!userLoaded || !pluginsLoaded || userLoading) {
    log.debug('Loading:', 'user =', userLoaded, ', plugins =', pluginsLoaded)
    return <HawtioLoadingPage />
  }

  log.debug(`Login state: username = ${username}, isLogin = ${isLogin}`)

  const defaultPlugin = plugins[0] ?? null
  const defaultPage = defaultPlugin ? <Navigate to={{ pathname: defaultPlugin.path, search }} /> : <HawtioHome />

  const showVerticalNavByDefault = preferencesService.isShowVerticalNavByDefault()

  const keepAlive = (): void => {
    sessionService.userActivity()
  }

  return (
    <PageContext.Provider value={{ username, plugins }}>
      <BackgroundImage src={backgroundImages} />
      <Page
        id='hawtio-main-page'
        header={<HawtioHeader />}
        sidebar={<HawtioSidebar />}
        isManagedSidebar
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
      <EmptyStateIcon icon={CubesIcon} />
      <Title headingLevel='h1' size='lg'>
        Hawtio
      </Title>
    </EmptyState>
  </PageSection>
)
