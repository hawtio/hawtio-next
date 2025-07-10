import { hawtio, type HawtioPlugin } from '@hawtio/react'

// we import this module from ../index.ts in normal way
// but import() statements used below refer to ModuleFederation identifiers for "remote" modules,
// so the resolution is performed at runtime (in browser)
//
// registerRemoteExamplesStatically() deals with two "exposed" (by webpack + module-federation) modules:
// remote1 and remote2. The only visible difference in JavaScript code is that instead of:
//     import('../remote1').then()
// we use:
//     import('static-remotes/remote1').then()
//
// we don't touch "remote3" at all here - it'll be loaded fully dynamically using @module-federation/utilities
//
// there are no warnings in this file thanks to aliases declared in tsconfig.json, which is not used by
// webpack + swc-loader

export const registerRemoteExamplesStatically: HawtioPlugin = () => {
  hawtio.addDeferredPlugin('exampleStaticRemote1', async () => {
    return import('static-remotes/remote1').then(m => {
      // this module exports only the React/Patternfly component, so we register it ourselves
      return {
        id: 'exampleStaticRemote1',
        title: 'Remote plugin 1 (static)',
        path: '/remote1',
        component: m.RemotePlugin,
        isActive: async () => true,
      }
    })
  })
  // Here we NEED to know the plugin ID - we can't import it from the module if we want to stay fully asynchronous
  hawtio.addDeferredPlugin('remote2', async () => {
    return import('static-remotes/remote2').then(m => {
      // this module exports a function which returns a plugin definition (object),
      // which we can return as chained promise - Hawtio will eventually await for the definition
      return m.remotePlugin()
    })
  })
  // in theory and for completeness, there's a 3rd scenario here. The remote module may export a function
  // which calls one of:
  //  - hawtio.addPlugin()
  //  - hawtio.addDeferredPlugin()
  // but there would be only one way to ensure that the plugin is actually registered:
  // 1. 'static-remotes/remoteX' should be imported with `import`, not with `import()`
  // 2. if the exported function calls hawtio.addDeferredPlugin() we're safe
  // 3. if the exported function calls hawtio.addPlugin() we're also safe, but we're effectively statically
  //    importing Patternfly modules if such plugin uses it.
  //
  // if we would like to import such remote module with import() as in the above examples, the import() itself
  // returns a promise so registerRemoteExamplesStatically would have to become async, we would have to await
  // for such import() and bootstrap.tsx itself should then await for registerRemoteExamplesStatically()
  // that's why there's no such example
}
