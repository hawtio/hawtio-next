import { CodeBlock, CodeBlockCode, PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

export const RemotePlugin: React.FunctionComponent = () => (
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component='h1'>Remote Plugin 1</Text>
      <Text component='p'>
        This is a remote plugin that is imported like normal JavaScript module, but its name/path{' '}
        <code>static-remotes/remote1</code>
        is actually handled by webpack at build time with this config of <code>ModuleFederationPlugin</code>:
      </Text>
      <CodeBlock>
        <CodeBlockCode>
          {`name: 'app',
filename: 'remoteEntry.js',
...
exposes: {
  './remote1': './src/examples/remote1',
  './remote2': './src/examples/remote2'
},
...
remotes: {
  "static-remotes": "app@http://localhost:3000/hawtio/remoteEntry.js"
},`}
        </CodeBlockCode>
      </CodeBlock>
      <Text component='p'>
        This is handled in JavaScript by normal <code>import()</code> statements:
      </Text>
      <CodeBlock>
        <CodeBlockCode>
          {`hawtio.addDeferredPlugin('exampleStaticRemote1', async () => {
  return import('static-remotes/remote1').then(m => {
    // this module exports only the React/PatternFly component, so we register it ourselves
    return {
      id: 'exampleStaticRemote1',
      title: 'Remote plugin 1 (static)',
      path: '/remote1',
      component: m.RemotePlugin,
      isActive: async () => true,
    }
  })
})

hawtio.addDeferredPlugin('remote2', async () => {
  return import('static-remotes/remote2').then(m => {
    // this module exports a function which returns a plugin definition (object),
    // which we can return as chained promise - Hawtio will eventually await for the definition
    return m.remotePlugin()
  })
})`}
        </CodeBlockCode>
      </CodeBlock>
    </TextContent>
  </PageSection>
)
