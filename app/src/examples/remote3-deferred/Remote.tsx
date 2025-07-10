import { PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

export const RemotePlugin: React.FunctionComponent = () => (
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component='h1'>Remote Plugin 3 (deferred)</Text>
      <Text component='p'>
        This is another remote plugin that is loaded dynamically using <code>@module-federation/utilities</code>{' '}
        library.
      </Text>
      <Text component='p'>
        This plugin calls <code>hawtio.addDeferredPlugin()</code> which is evaluated by Hawtio in dedicated stage.
      </Text>
    </TextContent>
  </PageSection>
)
