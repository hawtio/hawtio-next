import { hawtio } from '@hawtio/core'
import { HawtioHelp } from '@hawtio/help/HawtioHelp'
import { HawtioPreferences } from '@hawtio/preferences/HawtioPreferences'
import { EmptyState, EmptyStateIcon, EmptyStateVariant, Page, PageSection, PageSectionVariants, Title } from '@patternfly/react-core'
import { CubesIcon } from '@patternfly/react-icons'
import React from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { HawtioBackground } from './HawtioBackground'
import { HawtioHeader } from './HawtioHeader'
import { HawtioSidebar } from './HawtioSidebar'

export const HawtioPage: React.FunctionComponent = () => {
  const HawtioHome = () => (
    <PageSection variant={PageSectionVariants.light}>
      <EmptyState variant={EmptyStateVariant.full}>
        <EmptyStateIcon icon={CubesIcon} />
        <Title headingLevel="h1" size="lg">Hawtio</Title>
      </EmptyState>
    </PageSection>
  )

  return (
    <BrowserRouter>
      <HawtioBackground />
      <Page
        header={<HawtioHeader />}
        sidebar={<HawtioSidebar />}
        isManagedSidebar
      >
        <Switch>
          {/* plugins */}
          {hawtio.getPlugins().map(plugin => (
            <Route
              key={plugin.id}
              path={plugin.path}
              component={plugin.component} />
          ))}
          <Route path='/help'>
            <HawtioHelp />
          </Route>
          <Route path='/preferences'>
            <HawtioPreferences />
          </Route>
          <Route path='/'>
            <HawtioHome />
          </Route>
        </Switch>
      </Page>
    </BrowserRouter>
  )
}
