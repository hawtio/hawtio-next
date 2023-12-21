import { CodeBlock, CodeBlockCode, PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

export const Example2: React.FunctionComponent = () => (
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component='h1'>Example 2</Text>
      <Text component='p'>
        This is another example plugin that demonstrates how you can customise <code>hawtconfig.json</code> from an
        external plugin.
      </Text>
      <Text component='p'>
        See: <code>app/src/examples/example2/index.ts</code>
      </Text>
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
    </TextContent>
  </PageSection>
)
