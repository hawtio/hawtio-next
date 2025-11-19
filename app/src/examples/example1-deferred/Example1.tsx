import { CodeBlock, CodeBlockCode, PageSection, Content,  } from '@patternfly/react-core'
import React from 'react'

export const Example1: React.FunctionComponent = () => (
  <PageSection hasBodyWrapper={false} >
    <Content>
      <Content component='h1'>Example 1</Content>
      <Content component='p'>
        This is an example plugin registered using <code>hawtio.addDeferredPlugin()</code>.
      </Content>
      <Content component='p'>
        This plugin doesn't import <code>./Example1</code> file using <em>static</em> <code>import</code> statement, but
        with <em>dynamic</em> <code>import()</code> operator.
      </Content>
      <Content component='p'>Here's the preferred, asynchronous, Hawtio plugin registration code:</Content>
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
    </Content>
  </PageSection>
)
