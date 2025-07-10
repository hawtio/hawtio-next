import { CodeBlock, CodeBlockCode, PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

export const Example1: React.FunctionComponent = () => (
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component='h1'>Example 1</Text>
      <Text component='p'>
        This is an example plugin registered using <code>hawtio.addPlugin()</code>.
      </Text>
      <Text component='p'>
        This plugin doesn't use any asynchronous code. The disadvantage is that with static <code>import</code>
        JavaScript statement, the resulting bundle is much less optimized, because all Patternfly components used by{' '}
        <code>Example1</code> are loaded in <em>static way</em>. This approach can lead to increased size of chunks
        loaded when application starts, thus delaying initial UI response.
      </Text>
      <Text component='p'>Here's the simplest Hawtio plugin registration code:</Text>
      <CodeBlock>
        <CodeBlockCode>
          {`import { hawtio, type HawtioPlugin } from '@hawtio/react'
import { Example1 } from './Example1'

export const registerExample1: HawtioPlugin = () => {
  hawtio.addPlugin({
    id: 'example1a',
    title: 'Example 1 (immediate)',
    path: '/example1a',
    component: Example1,
    isActive: async () => true,
  })
}`}
        </CodeBlockCode>
      </CodeBlock>
    </TextContent>
  </PageSection>
)
