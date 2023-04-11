import { useUser } from '__root__/auth/hooks'
import { usePlugins } from '__root__/core'
import { HawtioHelp } from '__root__/help/HawtioHelp'
import { backgroundImages } from '__root__/img'
import { PluginNodeSelectionContext, usePluginNodeSelected } from '__root__/plugins'
import { HawtioPreferences, preferencesService } from '__root__/preferences'
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
import { PageContext } from './context'
import { log } from './globals'
import { HawtioHeader } from './HawtioHeader'
import { HawtioLoading } from './HawtioLoading'
import { HawtioSidebar } from './HawtioSidebar'

export const HawtioPage: React.FunctionComponent = () => {
  const { username, isLogin, userLoaded } = useUser()
  const { plugins, pluginsLoaded } = usePlugins()
  const navigate = useNavigate()
  const { search } = useLocation()
  const { selectedNode, setSelectedNode } = usePluginNodeSelected()

  if (!userLoaded || !pluginsLoaded) {
    return <HawtioLoading />
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

  const defaultPlugin = plugins[0] || null
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
