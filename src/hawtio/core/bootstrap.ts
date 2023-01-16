import { log } from './globals'
import './logging'
import { hawtio } from './plugin-loader'

export const bootstrap = () => {
  hawtio.loadPlugins(plugins => {
    log.info('Plugins loaded:', plugins)
  })
  log.info('Bootstrapped Hawtio')
}
