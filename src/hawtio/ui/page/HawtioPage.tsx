import { EmptyState, EmptyStateIcon, EmptyStateVariant, Page, PageSection, PageSectionVariants, Title } from '@patternfly/react-core'
import { CubesIcon } from '@patternfly/react-icons'
import React from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import Example1 from '../../../examples/example1/Example1'
import Example2 from '../../../examples/example2/Example2'
import Example3 from '../../../examples/example3/Example3'
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
            <Route path='/example1' component={Example1} />
            <Route path='/example2' component={Example2} />
            <Route path='/example3' component={Example3} />
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
