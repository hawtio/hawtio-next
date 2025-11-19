import { PageSection, Content,  } from '@patternfly/react-core'
import React from 'react'

export const RemotePlugin: React.FunctionComponent = () => (
  <PageSection hasBodyWrapper={false} >
    <Content>
      <Content component='h1'>Remote Plugin 2</Content>
      <Content component='p'>
        This is another plugin <em>loaded</em> by webpack using configuration in <code>webpack.config.js</code>.
      </Content>
    </Content>
  </PageSection>
)
