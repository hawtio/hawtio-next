import { hawtio } from './plugin-loader'

export const bootstrap = () => {
  hawtio.loadPlugins(() => {
    console.log('Loaded plugins')
  })
  console.log('Bootstrapped Hawtio')
}
