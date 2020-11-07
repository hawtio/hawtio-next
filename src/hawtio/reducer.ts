import { Action } from 'redux'
import { ThunkAction, ThunkDispatch } from 'redux-thunk'
import { reducerWithInitialState } from 'typescript-fsa-reducers'
import HawtioState from './state'
import actionCreatorFactory from 'typescript-fsa'

const actionCreator = actionCreatorFactory('hawtio')

export const actions = {
  xxx: actionCreator<{}>('XXX'),
  yyy: actionCreator<{}>('YYY'),
  zzz: actionCreator<{}>('ZZZ')
}

export type HawtioThunkAction = ThunkAction<Promise<void>, HawtioState, any, Action<any>>
export type HawtioThunkDispatch = ThunkDispatch<HawtioState, any, Action<any>>

const reducer = reducerWithInitialState({})

export default reducer
