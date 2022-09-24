import { Action } from 'redux'
import { ThunkAction, ThunkDispatch } from 'redux-thunk'
import { reducerWithInitialState } from 'typescript-fsa-reducers'
import { HawtioState } from './state'
import actionCreatorFactory from 'typescript-fsa'

const actionCreator = actionCreatorFactory('hawtio')

export const actions = {
  xxx: actionCreator<unknown>('XXX'),
  yyy: actionCreator<unknown>('YYY'),
  zzz: actionCreator<unknown>('ZZZ')
}

export type HawtioThunkAction = ThunkAction<Promise<void>, HawtioState, unknown, Action<unknown>>
export type HawtioThunkDispatch = ThunkDispatch<HawtioState, unknown, Action<unknown>>

export const reducer = reducerWithInitialState({})
