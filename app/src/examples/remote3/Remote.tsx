import { PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

export const RemotePlugin: React.FunctionComponent = () => (
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component='h1'>Remote Plugin 3</Text>
      <Text component='p'>
        This is a remote plugin that is loaded dynamically and not declared in <code>webpack.config.js</code>.
      </Text>
      <Text component='p'>
        This plugin is loaded by Hawtio using <code>@module-federation/utilities</code> library. It is first discovered
        dynamically from <code>/plugin</code> endpoint.
      </Text>
    </TextContent>
  </PageSection>
)
