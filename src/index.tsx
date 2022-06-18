import { bootstrap as hawtioBootstrap } from '@hawtio/core'
import Hawtio from '@hawtio/Hawtio'
import store from '@hawtio/store'
import '@patternfly/react-core/dist/styles/base.css'
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import './index.css'
import reportWebVitals from './reportWebVitals'
import registerExamples from './examples'

// TODO: debugging
(window as any).store = store

// Bootstrap Hawtio
registerExamples()
hawtioBootstrap()

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <Hawtio />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
