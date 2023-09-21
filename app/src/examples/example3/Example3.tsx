import { CodeBlock, CodeBlockCode, PageSection, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

export const Example3: React.FunctionComponent = () => (
  <PageSection variant='light'>
    <TextContent>
      <Text component='h1'>Example 3</Text>
      <Text component='p'>
        This is another example plugin that also demonstrates the addition of custom components to the main header
        toolbar.
      </Text>
      <Text component='p'>
        Components should be added in to the Plugin structure using the <code>headerItems</code> array. Toolbar
        components should be created as single <code>FunctionComponent</code>s and added to the array.
      </Text>
      <Text component='p'>
        Header components will remain in the toolbar until the focus is changed to an alternative plugin. However,
        should you wish to persist the components despite the UI focus then an alternative structure can be added to the{' '}
        <code>headerItems</code> array in the form:
      </Text>
      <CodeBlock>
        <CodeBlockCode>&#123;component: MyComponent, universal: true&#125;</CodeBlockCode>
      </CodeBlock>
    </TextContent>
  </PageSection>
)
