import { PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

export const RemotePlugin: React.FunctionComponent = () => (
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component='h1'>Remote Plugin 2</Text>
      <Text component='p'>
        This is another plugin <em>loaded</em> by webpack using configuration in <code>webpack.config.js</code>.
      </Text>
    </TextContent>
  </PageSection>
)
