import { PageSection, Content } from '@patternfly/react-core'
import React from 'react'

export const Example1: React.FunctionComponent = () => (
  <PageSection hasBodyWrapper={false}>
    <Content>
      <Content component='h1'>Example 1</Content>
      <Content component='p'>
        This is an example plugin registered using <code>hawtio.addPlugin()</code> with wrong approach to
        synchronization.
      </Content>
    </Content>
  </PageSection>
)
