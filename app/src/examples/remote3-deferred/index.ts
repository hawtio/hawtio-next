import { hawtio, type HawtioPlugin, Logger } from '@hawtio/react'

// this is another "dynamic plugin" which is called by Hawtio through @module-federation/utilities, without
// checking the returned value.
// We're free to register actual plugin - this example calls hawtio.addDeferredPlugin(), so it's actually synchronous
// itself - Hawtio will evaluate deferred plugins later, after loading remote/dynamic plugins
// We don't return a promise here, because we're using dynamic import() inside a function passed to
// hawtio.addDeferredPlugin()
// addDeferredPlugin() returns immediately and Hawtio already knows there's a plugin that should be evaluated
export const registerRemoteDeferred: HawtioPlugin = () => {
  Logger.get('remote3-deferred').info('Running remote, deferred plugin')

  hawtio.addDeferredPlugin('remote3-deferred', async () => {
    return import('@hawtio/react').then(async m => {
      const log = m.Logger.get('remote')
      log.info('Loaded')
      return import('./Remote').then(r => {
        return {
          id: 'remote3-deferred',
          title: 'Remote plugin 3 (dynamic, deferred)',
          path: '/remote3b',
          component: r.RemotePlugin,
          isActive: async () => true,
        }
      })
    })
  })
}
