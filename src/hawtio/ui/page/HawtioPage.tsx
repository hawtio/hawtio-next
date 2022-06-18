import hawtio from '@hawtio/core'
import { EmptyState, EmptyStateIcon, EmptyStateVariant, Page, PageSection, PageSectionVariants, Title } from '@patternfly/react-core'
import { CubesIcon } from '@patternfly/react-icons'
import React from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import HawtioBackground from './HawtioBackground'
import HawtioHeader from './HawtioHeader'
import HawtioSidebar from './HawtioSidebar'

type HawtioPageProps = {
}

type HawtioPageState = {
}

class HawtioPage extends React.Component<HawtioPageProps, HawtioPageState> {
  constructor(props: HawtioPageProps) {
    super(props)
    this.state = {
    }
  }

  render() {
    return (
      <BrowserRouter>
        <HawtioBackground />
        <Page
          header={<HawtioHeader />}
          sidebar={<HawtioSidebar />}
          isManagedSidebar
        >
          <Switch>
            {hawtio.getPlugins().map(plugin => (
              <Route
                key={plugin.id}
                path={plugin.path}
                component={plugin.component} />
            ))}
            <Route path='/'>
              <PageSection variant={PageSectionVariants.light}>
                <EmptyState variant={EmptyStateVariant.full}>
                  <EmptyStateIcon icon={CubesIcon} />
                  <Title headingLevel="h5" size="lg">Hawtio</Title>
                </EmptyState>
              </PageSection>
            </Route>
          </Switch>
        </Page>
      </BrowserRouter>
    )
  }
}

export default HawtioPage
