import { hawtio, HawtioPlugin } from '@hawtio/react'

// we import this module from ../index.ts in normal way
// but import() statements used below refer to ModuleFederation identifiers for "remote" modules,
// so the resolution is performed at runtime (in browser)
//
// there are no warnings in this file thanks to aliases declared in tsconfig.json, which is not used by
// webpack + swc-loader

export const registerRemoteExamplesStatically: HawtioPlugin = () => {
  import("static-remotes/remote1").then(m => {
    // this module exports the component, so we register it manually
    hawtio.addPlugin({
      id: 'exampleStaticRemote1',
      title: 'Remote plugin 1 (static)',
      path: '/remote1',
      component: m.RemotePlugin,
      isActive: async () => true,
    })
  })
  import("static-remotes/remote2").then(m => {
    // this module exports a function which registers own component using Hawtio API
    m.registerRemote()
  })
}
