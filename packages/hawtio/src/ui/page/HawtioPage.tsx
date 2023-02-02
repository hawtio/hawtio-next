import { HawtioHelp } from '@hawtio/help/HawtioHelp'
import { HawtioPreferences } from '@hawtio/preferences/HawtioPreferences'
import { EmptyState, EmptyStateIcon, EmptyStateVariant, Page, PageSection, PageSectionVariants, Spinner, Title } from '@patternfly/react-core'
import { CubesIcon } from '@patternfly/react-icons'
import React from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { HawtioNotification } from '../notification/HawtioNotification'
import { PageContext, usePlugins } from './context'
import { HawtioBackground } from './HawtioBackground'
import { HawtioHeader } from './HawtioHeader'
import { HawtioSidebar } from './HawtioSidebar'

export const HawtioPage: React.FunctionComponent = () => {
  const { plugins, loaded } = usePlugins()
  const { search } = useLocation()

  if (!loaded) {
    return (
      <Page>
        <PageSection>
          <Spinner isSVG aria-label="Loading Hawtio" />
        </PageSection>
      </Page>
    )
  }

  const HawtioHome = () => (
    <PageSection variant={PageSectionVariants.light}>
      <EmptyState variant={EmptyStateVariant.full}>
        <EmptyStateIcon icon={CubesIcon} />
        <Title headingLevel="h1" size="lg">Hawtio</Title>
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

  return (
    <PageContext.Provider value={{ plugins, loaded }}>
      <HawtioBackground />
      <Page
        header={<HawtioHeader />}
        sidebar={<HawtioSidebar />}
        isManagedSidebar
      >
        <Routes>
          {/* plugins */}
          {plugins.map(plugin => (
            <Route
              key={plugin.id}
              path={`${plugin.path}/*`}
              element={React.createElement(plugin.component)}/>
          ))}
          <Route key='help' path='help/*' element={<HawtioHelp />} />
          <Route key='preferences' path='preferences/*' element={<HawtioPreferences />} />

          <Route index key='root' path='/' element={defaultPage} />
        </Routes>
      <HawtioNotification />
      </Page>
    </PageContext.Provider>
  )
}
