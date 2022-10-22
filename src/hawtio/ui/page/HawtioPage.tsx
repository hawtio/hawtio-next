import { hawtio } from '@hawtio/core'
import { HawtioHelp } from '@hawtio/help/HawtioHelp'
import { HawtioPreferences } from '@hawtio/preferences/HawtioPreferences'
import { EmptyState, EmptyStateIcon, EmptyStateVariant, Page, PageSection, PageSectionVariants, Title } from '@patternfly/react-core'
import { CubesIcon } from '@patternfly/react-icons'
import React from 'react'
import { Redirect, Route, Switch, useLocation } from 'react-router-dom'
import { HawtioBackground } from './HawtioBackground'
import { HawtioHeader } from './HawtioHeader'
import { HawtioSidebar } from './HawtioSidebar'

const log = console

export const HawtioPage: React.FunctionComponent = () => {
  const { search } = useLocation()

  const HawtioHome = () => (
    <PageSection variant={PageSectionVariants.light}>
      <EmptyState variant={EmptyStateVariant.full}>
        <EmptyStateIcon icon={CubesIcon} />
        <Title headingLevel="h1" size="lg">Hawtio</Title>
      </EmptyState>
    </PageSection>
  )

  log.debug('Plugins:', hawtio.getPlugins())

  const defaultPlugin = hawtio.defaultPlugin()
  const defaultPage = defaultPlugin ? <Redirect to={{
    pathname: defaultPlugin.path, search
  }} /> : <HawtioHome />

  return (
    <React.Fragment>
      <HawtioBackground />
      <Page
        header={<HawtioHeader />}
        sidebar={<HawtioSidebar />}
        isManagedSidebar
      >
        <Switch>
          {/* plugins */}
          {hawtio.getPlugins()
            .filter(plugin => plugin.isActive?.() !== false)
            .map(plugin => (
              <Route
                key={plugin.id}
                path={plugin.path}
                component={plugin.component} />
            ))
          }
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
    </React.Fragment>
  )
}
