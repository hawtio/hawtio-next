import pluginLoader from './plugin-loader'

const bootstrap = () => {
  pluginLoader.loadPlugins(() => {
    console.log('Loaded plugins')
  })
  console.log('Bootstrapped Hawtio')
}

export default bootstrap
