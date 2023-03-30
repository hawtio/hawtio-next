import { PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

export const RemotePlugin: React.FunctionComponent = () => (
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component='h1'>Remote Plugin</Text>
      <Text component='p'>This is a remote plugin that is loaded from an external location.</Text>
    </TextContent>
  </PageSection>
)
