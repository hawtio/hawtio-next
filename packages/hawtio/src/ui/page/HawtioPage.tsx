import { useUser } from '@hawtiosrc/auth/hooks'
import { usePlugins } from '@hawtiosrc/core'
import { HawtioHelp } from '@hawtiosrc/help/HawtioHelp'
import { backgroundImages } from '@hawtiosrc/img'
import { PluginNodeSelectionContext, usePluginNodeSelected } from '@hawtiosrc/plugins'
import { HawtioPreferences } from '@hawtiosrc/preferences/HawtioPreferences'
import { preferencesService } from '@hawtiosrc/preferences/preferences-service'
import {
  BackgroundImage,
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  Page,
  PageSection,
  PageSectionVariants,
  Title,
} from '@patternfly/react-core'
import { CubesIcon } from '@patternfly/react-icons'
import React from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { HawtioNotification } from '../notification'
import { HawtioHeader } from './HawtioHeader'
import { HawtioLoadingPage } from './HawtioLoadingPage'
import { HawtioSidebar } from './HawtioSidebar'
import { PageContext } from './context'
import { log } from './globals'

export const HawtioPage: React.FunctionComponent = () => {
  const { username, isLogin, userLoaded } = useUser()
  const { plugins, pluginsLoaded } = usePlugins()
  const navigate = useNavigate()
  const { search } = useLocation()
  const { selectedNode, setSelectedNode } = usePluginNodeSelected()

  if (!userLoaded || !pluginsLoaded) {
    log.debug('Loading:', 'user =', userLoaded, ', plugins =', pluginsLoaded)
    return <HawtioLoadingPage />
  }

  log.debug(`Login state: username = ${username}, isLogin = ${isLogin}`)

  if (!isLogin) {
    navigate('login')
  }

  const HawtioHome = () => (
    <PageSection variant={PageSectionVariants.light}>
      <EmptyState variant={EmptyStateVariant.full}>
        <EmptyStateIcon icon={CubesIcon} />
        <Title headingLevel='h1' size='lg'>
          Hawtio
        </Title>
      </EmptyState>
    </PageSection>
  )

  const defaultPlugin = plugins[0] ?? null
  let defaultPage
  if (defaultPlugin) {
    defaultPage = <Navigate to={{ pathname: defaultPlugin.path, search }} />
  } else {
    defaultPage = <HawtioHome />
  }

  const showVerticalNavByDefault = preferencesService.isShowVerticalNavByDefault()

  return (
    <PageContext.Provider value={{ username, plugins }}>
      <BackgroundImage src={backgroundImages} />
      <Page
        header={<HawtioHeader />}
        sidebar={<HawtioSidebar />}
        isManagedSidebar
        defaultManagedSidebarIsOpen={showVerticalNavByDefault}
      >
        {/* Provider for handling selected node shared between the plugins */}
        <PluginNodeSelectionContext.Provider value={{ selectedNode, setSelectedNode }}>
          <Routes>
            {/* plugins */}
            {plugins.map(plugin => (
              <Route key={plugin.id} path={`${plugin.path}/*`} element={React.createElement(plugin.component)} />
            ))}
            <Route key='help' path='help/*' element={<HawtioHelp />} />
            <Route key='preferences' path='preferences/*' element={<HawtioPreferences />} />

            <Route key='root' index element={defaultPage} />
          </Routes>
        </PluginNodeSelectionContext.Provider>
        <HawtioNotification />
      </Page>
    </PageContext.Provider>
  )
}
