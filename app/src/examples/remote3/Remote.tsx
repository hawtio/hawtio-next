import { PageSection, Content,  } from '@patternfly/react-core'
import React from 'react'

export const RemotePlugin: React.FunctionComponent = () => (
  <PageSection hasBodyWrapper={false} >
    <Content>
      <Content component='h1'>Remote Plugin 3 (immediate)</Content>
      <Content component='p'>
        This is a remote plugin that is loaded dynamically and not declared in <code>webpack.config.js</code>.
      </Content>
      <Content component='p'>
        This plugin is loaded by Hawtio using <code>@module-federation/utilities</code> library. It is first discovered
        dynamically from <code>/plugin</code> endpoint which returns a JSON array with <code>HawtioRemote</code>{' '}
        objects. These objects are extensions of <code>ImportRemoteOptions</code> type which is declared in{' '}
        <code>@module-federation/utilities</code>.
      </Content>
      <Content component='p'>
        This plugin calls <code>hawtio.addPlugin()</code> which is a process of immediate registration of the plugin.
      </Content>
    </Content>
  </PageSection>
)
