import { type HawtioAsyncPlugin } from '@hawtio/react'

// This module is used through "exposes" configuration of Webpack's ModuleFederationPlugin.
// Exported "remotePlugin" is a function which should NOT asynchronously call hawtio.addPlugin() -
// it should return a Promise resolved to a Plugin, so the importing code could call hawtio.addDeferredPlugin()
// for better synchronization

export const remotePluginName = 'remote2'

export const remotePlugin: HawtioAsyncPlugin = async () => {
  return import('@hawtio/react').then(async (m) => {
    const log = m.Logger.get('remote')
    log.info('Loaded')
    return import('./Remote').then(r => {
      return {
        id: remotePluginName,
        title: 'Remote plugin 2 (static)',
        path: '/remote2',
        component: r.RemotePlugin,
        isActive: async () => true,
      }
    })
  })
}
