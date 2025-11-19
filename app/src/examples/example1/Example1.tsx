import { CodeBlock, CodeBlockCode, PageSection, Content,  } from '@patternfly/react-core'
import React from 'react'

export const Example1: React.FunctionComponent = () => (
  <PageSection hasBodyWrapper={false} >
    <Content>
      <Content component='h1'>Example 1</Content>
      <Content component='p'>
        This is an example plugin registered using <code>hawtio.addPlugin()</code>.
      </Content>
      <Content component='p'>
        This plugin doesn't use any asynchronous code. The disadvantage is that with static <code>import</code>
        JavaScript statement, the resulting bundle is much less optimized, because all PatternFly components used by{' '}
        <code>Example1</code> are loaded in <em>static way</em>. This approach can lead to increased size of chunks
        loaded when application starts, thus delaying initial UI response.
      </Content>
      <Content component='p'>Here's the simplest Hawtio plugin registration code:</Content>
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
    </Content>
  </PageSection>
)
