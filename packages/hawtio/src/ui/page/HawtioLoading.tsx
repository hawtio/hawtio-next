import { Page, PageSection, Spinner } from '@patternfly/react-core'
import React from 'react'

export const HawtioLoading: React.FunctionComponent = () => (
  <Page>
    <PageSection>
      <Spinner isSVG aria-label='Loading Hawtio' />
    </PageSection>
  </Page>
)
