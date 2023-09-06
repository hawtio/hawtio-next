import { PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

export const Example3: React.FunctionComponent = () => (
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component='h1'>Example 3</Text>
      <Text component='p'>
        This is another example plugin that also demonstrates the addition of custom components to the main header
        toolbar. Components should be added in the Plugin structure using the `headerItems` array. Toolbar components
        should be created as single FunctionComponents and added to the array.
      </Text>
    </TextContent>
  </PageSection>
)
