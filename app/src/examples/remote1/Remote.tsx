import { CodeBlock, CodeBlockCode, PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

export const RemotePlugin: React.FunctionComponent = () => (
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component='h1'>Remote Plugin 1</Text>
      <Text component='p'>
        This is a remote plugin that is imported like normal JavaScript module, but its name/path <code>static-remotes/remote1</code>
        is actually handled by webpack at build time with this config of <code>ModuleFederationPlugin</code>:</Text>
      <CodeBlock>
        <CodeBlockCode>{`name: 'app',
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
        <CodeBlockCode>{`import("static-remotes/remote1").then(m => {
  // this module exports the component, so we register it manually
  hawtio.addPlugin({
    id: 'exampleStaticRemote1',
    title: 'Example Remote 1 (static/webpack)',
    path: '/remote1',
    component: m.RemotePlugin,
    isActive: async () => true,
  })
})
import("static-remotes/remote2").then(m => {
  // this module exports a function which registers own component using Hawtio API, so we call this function
  m.registerRemote()
})`}
        </CodeBlockCode>
      </CodeBlock>
    </TextContent>
  </PageSection>
)
