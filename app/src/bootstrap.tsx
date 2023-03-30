import { configManager, hawtio, Hawtio, registerPlugins } from '@hawtio/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerExamples } from './examples'
import { reportWebVitals } from './reportWebVitals'

// Configure the console
const configure = () => {
  configManager.addProductInfo('Test App', '1.0.0')
  hawtio.addUrl('plugin')
}
configure()

// Bootstrap Hawtio
registerPlugins()
registerExamples()
hawtio.bootstrap()

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <Hawtio />
  </React.StrictMode>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
