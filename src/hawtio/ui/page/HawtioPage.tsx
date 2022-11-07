import { HawtioHelp } from '@hawtio/help/HawtioHelp'
import { HawtioPreferences } from '@hawtio/preferences/HawtioPreferences'
import { EmptyState, EmptyStateIcon, EmptyStateVariant, Page, PageSection, PageSectionVariants, Spinner, Title } from '@patternfly/react-core'
import { CubesIcon } from '@patternfly/react-icons'
import React from 'react'
import { Redirect, Route, Switch, useLocation } from 'react-router-dom'
import { PageContext, usePlugins } from './context'
import { HawtioBackground } from './HawtioBackground'
import { HawtioHeader } from './HawtioHeader'
import { HawtioSidebar } from './HawtioSidebar'

export const HawtioPage: React.FunctionComponent = () => {
  const { plugins, loaded } = usePlugins()
  const { search } = useLocation()

  if (!loaded) {
    return (
      <PageSection>
        <Spinner isSVG aria-label="Loading Hawtio" />
      </PageSection>
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
    defaultPage = <Redirect to={{ pathname: defaultPlugin.path, search }} />
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
        <Switch>
          {/* plugins */}
          {plugins.map(plugin => (
            <Route
              key={plugin.id}
              path={plugin.path}
              component={plugin.component}
            />
          ))}
          <Route key='help' path='/help'>
            <HawtioHelp />
          </Route>
          <Route key='preferences' path='/preferences'>
            <HawtioPreferences />
          </Route>
          <Route key='root' path='/' >
            {defaultPage}
          </Route>
        </Switch>
      </Page>
    </PageContext.Provider>
  )
}
