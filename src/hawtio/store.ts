import { createStore, applyMiddleware } from 'redux'
import reducer from './reducer'
import HawtioState from './state'
import thunk from 'redux-thunk'

const state = localStorage['hawtio-state'] ?
  JSON.parse(localStorage['hawtio-state']) : new HawtioState()
const store = createStore(reducer, state, applyMiddleware(thunk))
store.subscribe(() =>
  localStorage['hawtio-state'] = JSON.stringify(store.getState())
)

export default store
