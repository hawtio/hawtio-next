import { hawtio } from './plugin-loader'

export const bootstrap = () => {
  hawtio.loadPlugins(plugins => {
    console.log('Plugins loaded:', plugins)
  })
  console.log('Bootstrapped Hawtio')
}
