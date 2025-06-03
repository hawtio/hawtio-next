import { type HawtioPlugin, Logger } from '@hawtio/react'

export const registerRemote: HawtioPlugin = () => {
  Logger.get("remote3").info("Running remote plugin")

  import("@hawtio/react").then(m => {
    const log = m.Logger.get('remote')
    log.info('Loaded')
    import("./Remote").then(r => {
      m.hawtio.addPlugin({
        id: 'remote3',
        title: 'Remote plugin 2 (dynamic)',
        path: '/remote3',
        component: r.RemotePlugin,
        isActive: async () => true,
      })
    })
    log.info('Plugins', m.hawtio.getPlugins())
  })
}
