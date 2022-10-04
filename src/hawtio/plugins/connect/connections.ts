export interface Connections {
  [key: string]: Connection
}

export interface Connection {
  name: string
  scheme: string
  host: string
  port: number
  path: string

  useProxy?: boolean
  jolokiaUrl?: string
  username?: string
  password?: string
}

export const ADD = 'ADD'
export const UPDATE = 'UPDATE'
export const DELETE = 'DELETE'
export const RESET = 'RESET'

export type ConnectionsAction =
  | { type: typeof ADD, connection: Connection }
  | { type: typeof UPDATE, name: string, connection: Connection }
  | { type: typeof DELETE, name: string }
  | { type: typeof RESET }

export function reducer(state: Connections, action: ConnectionsAction): Connections {
  switch (action.type) {
    case ADD: {
      const { connection } = action
      if (state[connection.name]) {
        // TODO: error handling
        return state
      } else {
        return { ...state, [connection.name]: connection }
      }
    }
    case UPDATE: {
      const { name, connection } = action
      if (name === connection.name) {
        // normal update
        if (state[connection.name]) {
          return { ...state, [connection.name]: connection }
        } else {
          // TODO: error handling
          return state
        }
      } else {
        // name change
        if (state[connection.name]) {
          // TODO: error handling
          return state
        } else {
          return Object.fromEntries(Object.entries(state).map(([k, v]) =>
            k === name ? [connection.name, connection] : [k, v]
          ))
        }
      }
    }
    case DELETE: {
      const { name } = action
      const newState = { ...state }
      delete newState[name]
      return newState
    }
    case RESET:
      return {}
    default:
      return state
  }
}
