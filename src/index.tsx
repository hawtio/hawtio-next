import '@patternfly/react-core/dist/styles/base.css'
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import hawtioBootstrap from './hawtio/core/bootstrap'
import Hawtio from './hawtio/Hawtio'
import store from './hawtio/store'
import './index.css'
import * as serviceWorker from './serviceWorker'

// TODO: debugging
(window as any).store = store

// Bootstrap Hawtio
hawtioBootstrap()

ReactDOM.render(
  <Provider store={store}>
    <Hawtio />
  </Provider>,
  document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
