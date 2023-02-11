import { PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

export const DisabledExample: React.FunctionComponent = () => (
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component='h1'>Disabled Plugin</Text>
      <Text component='p'>This is an disabled plugin. It should not be visible in the console.</Text>
    </TextContent>
  </PageSection>
)
