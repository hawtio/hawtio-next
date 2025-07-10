import { type HawtioAsyncPlugin, Logger } from '@hawtio/react'

// this module is consumed fully dynamically - Hawtio uses @module-federation/utilities to load and call it,
// so the single exported symbol should be declared explicitly in JSON file returned from endpoint added
// to Hawtio using hawtio.addUrl()
// Here's a part of the JSON which points Hawtio to actual exported symbol:
//     pluginEntry: 'registerRemote'
//
// Hawtio doesn't assume any return value from this exported function. It only checks if the value is a Promise
// object so it can synchronize on its resolution.
// The responsibility of this function is to eventually register the plugin in Hawtio
export const registerRemote: HawtioAsyncPlugin = async () => {
  Logger.get('remote3').info('Running remote plugin')

  // because we return a promise chain, we can be sure that final hawtio.addPlugin() will be called before
  // displaying the UI
  return import('@hawtio/react').then(async m => {
    const log = m.Logger.get('remote')
    log.info('Loaded')
    return import('./Remote').then(r => {
      m.hawtio.addPlugin({
        id: 'remote3',
        title: 'Remote plugin 3 (dynamic, immediate)',
        path: '/remote3a',
        component: r.RemotePlugin,
        isActive: async () => true,
      })
    })
  })
}
