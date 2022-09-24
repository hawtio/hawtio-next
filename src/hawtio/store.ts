import { configureStore } from '@reduxjs/toolkit'
import { reducer } from './reducer'
import { HawtioState } from './state'

const state = localStorage['hawtio-state'] ?
  JSON.parse(localStorage['hawtio-state']) : new HawtioState()

//const store = createStore(reducer, state, applyMiddleware(thunk))
export const store = configureStore({
  reducer: reducer,
  preloadedState: state,
})

store.subscribe(() =>
  localStorage['hawtio-state'] = JSON.stringify(store.getState())
)
