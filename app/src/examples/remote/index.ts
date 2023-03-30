import { hawtio, HawtioPlugin, Logger } from '@hawtio/react'
import { RemotePlugin } from './Remote'

const log = Logger.get('remote')

export const registerRemote: HawtioPlugin = () => {
  log.info('Loaded')
  hawtio.addPlugin({
    id: 'remote',
    title: 'Remote Plugin',
    path: '/remote',
    component: RemotePlugin,
    isActive: async () => true,
  })
  log.info('Plugins', hawtio.getPlugins())
}
