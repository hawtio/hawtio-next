import { CodeBlock, CodeBlockCode, PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

export const Example1: React.FunctionComponent = () => (
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component='h1'>Example 1</Text>
      <Text component='p'>
        This is an example plugin registered using <code>hawtio.addDeferredPlugin()</code>.
      </Text>
      <Text component='p'>
        This plugin doesn't import <code>./Example1</code> file using <em>static</em> <code>import</code> statement, but
        with <em>dynamic</em> <code>import()</code> operator.
      </Text>
      <Text component='p'>Here's the preferred, asynchronous, Hawtio plugin registration code:</Text>
      <CodeBlock>
        <CodeBlockCode>
          {`import { hawtio, type HawtioPlugin } from '@hawtio/react'

export const registerExample1Deferred: HawtioPlugin = () => {
  hawtio.addDeferredPlugin('example1b', async () => {
    return import('./Example1').then(m => {
      return {
        id: 'example1b',
        title: 'Example 1 (deferred)',
        path: '/example1b',
        component: m.Example1,
        isActive: async () => true,
      }
    })
  })
}`}
        </CodeBlockCode>
      </CodeBlock>
    </TextContent>
  </PageSection>
)
