import { PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

export const Example3: React.FunctionComponent = () => (
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component='h1'>Example 3</Text>
      <Text component='p'>
        This is another example plugin that also demonstrates the addition of custom components to the main header
        toolbar.
      </Text>
      <Text component='p'>
        Components should be added in to the Plugin structure using the `headerItems` array. Toolbar components should
        be created as single FunctionComponents and added to the array.
      </Text>
      <Text component='p'>
        Header components will remain in the toolbar until the focus is changed to an alternative plugin. However,
        should you wish to persist the components despite the UI focus then an alternative structure can be added to the
        `headerItems` array in the form <code>&#123;component: &apos;MyComponent&apos;, universal: true&#125;</code>.
      </Text>
    </TextContent>
  </PageSection>
)
