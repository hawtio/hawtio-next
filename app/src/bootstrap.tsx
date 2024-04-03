import { configManager, hawtio, Hawtio, registerPlugins } from '@hawtio/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerExamples } from './examples'

// Configure the console
const configure = () => {
  configManager.addProductInfo('Test App', '1.0.0')
  hawtio.addUrl('plugin')
}
configure()

// Bootstrap Hawtio
registerPlugins()

// You can also select which builtin plugins to load
//connect()
//jmx()
//camel()

registerExamples()
hawtio.bootstrap()

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <Hawtio />
  </React.StrictMode>,
)
