import { PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

export const Example3: React.FunctionComponent = () => (
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component='h1'>Example 3</Text>
      <Text component='p'>This is yet another example plugin.</Text>
    </TextContent>
  </PageSection>
)
