import { PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

export const Example2: React.FunctionComponent = () => (
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component='h1'>Example 2</Text>
      <Text component='p'>This is another example plugin.</Text>
    </TextContent>
  </PageSection>
)
