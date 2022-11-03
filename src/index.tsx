import '@patternfly/react-core/dist/styles/base.css'
import './index.css'

import { HawtioContextProvider } from '@hawtio/context'
import { bootstrap } from '@hawtio/core'
import { Hawtio } from '@hawtio/Hawtio'
import { registerPlugins } from '@hawtio/plugins'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerExamples } from './examples'
import { reportWebVitals } from './reportWebVitals'

// Bootstrap Hawtio
registerPlugins()
registerExamples()
bootstrap()

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)
root.render(
  <React.StrictMode>
    <HawtioContextProvider>
      <Hawtio />
    </HawtioContextProvider>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
