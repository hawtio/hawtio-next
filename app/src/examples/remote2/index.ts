import { type HawtioPlugin } from '@hawtio/react'

export const registerRemote: HawtioPlugin = () => {
  import("@hawtio/react").then(m => {
    const log = m.Logger.get('remote')
    log.info('Loaded')
    import("./Remote").then(r => {
      m.hawtio.addPlugin({
        id: 'remote2',
        title: 'Remote plugin 2 (static)',
        path: '/remote2',
        component: r.RemotePlugin,
        isActive: async () => true,
      })
    })
    log.info('Plugins', m.hawtio.getPlugins())
  })
}
