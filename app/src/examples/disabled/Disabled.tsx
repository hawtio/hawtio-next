import { PageSection, Content } from '@patternfly/react-core'
import React from 'react'

export const DisabledExample: React.FunctionComponent = () => (
  <PageSection hasBodyWrapper={false}>
    <Content>
      <Content component='h1'>Disabled Plugin</Content>
      <Content component='p'>This is an disabled plugin. It should not be visible in the console.</Content>
    </Content>
  </PageSection>
)
