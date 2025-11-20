import { CodeBlock, CodeBlockCode, PageSection, Content } from '@patternfly/react-core'
import React from 'react'

export const Example3: React.FunctionComponent = () => (
  <PageSection hasBodyWrapper={false}>
    <Content>
      <Content component='h1'>Example 3</Content>
      <Content component='p'>
        This is another example plugin that also demonstrates the addition of custom components to the main header
        toolbar.
      </Content>
      <Content component='p'>
        Components should be added in to the Plugin structure using the <code>headerItems</code> array. Toolbar
        components should be created as single <code>FunctionComponent</code>s and added to the array.
      </Content>
      <Content component='p'>
        Header components will remain in the toolbar until the focus is changed to an alternative plugin. However,
        should you wish to persist the components despite the UI focus then an alternative structure can be added to the{' '}
        <code>headerItems</code> array in the form:
      </Content>
      <CodeBlock>
        <CodeBlockCode>&#123;component: MyComponent, universal: true&#125;</CodeBlockCode>
      </CodeBlock>
    </Content>
  </PageSection>
)
