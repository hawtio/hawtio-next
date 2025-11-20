import { PageSection, Content } from '@patternfly/react-core'
import React from 'react'

export const RemotePlugin: React.FunctionComponent = () => (
  <PageSection hasBodyWrapper={false}>
    <Content>
      <Content component='h1'>Remote Plugin 3 (deferred)</Content>
      <Content component='p'>
        This is another remote plugin that is loaded dynamically using <code>@module-federation/utilities</code>{' '}
        library.
      </Content>
      <Content component='p'>
        This plugin calls <code>hawtio.addDeferredPlugin()</code> which is evaluated by Hawtio in dedicated stage.
      </Content>
    </Content>
  </PageSection>
)
