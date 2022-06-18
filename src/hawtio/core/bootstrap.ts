import hawtio from './plugin-loader'

const bootstrap = () => {
  hawtio.loadPlugins(() => {
    console.log('Loaded plugins')
  })
  console.log('Bootstrapped Hawtio')
}

export default bootstrap
