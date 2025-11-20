import { CodeBlock, CodeBlockCode, PageSection, Content } from '@patternfly/react-core'
import React from 'react'

export const Example2: React.FunctionComponent = () => (
  <PageSection hasBodyWrapper={false}>
    <Content>
      <Content component='h1'>Example 2</Content>
      <Content component='p'>
        This is another example plugin that demonstrates how you can customise <code>hawtconfig.json</code> from an
        external plugin.
      </Content>
      <Content component='p'>
        See: <code>app/src/examples/example2/index.ts</code>
      </Content>
      <CodeBlock>
        <CodeBlockCode>
          {`configManager.configure(config => {
  if (!config.about) {
    config.about = {}
  }
  const description = config.about.description
  config.about.description = (description ?? '') + ' This text is added by the example 2 plugin.'
  if (!config.about.productInfo) {
    config.about.productInfo = []
  }
  config.about.productInfo.push({ name: 'Example 2', value: '1.0.0' })
})`}
        </CodeBlockCode>
      </CodeBlock>
    </Content>
  </PageSection>
)
