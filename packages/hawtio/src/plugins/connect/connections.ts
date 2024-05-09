import { Connection, Connections } from '@hawtiosrc/plugins/shared'
import { connectService } from '@hawtiosrc/plugins/shared/connect-service'

export const ADD = 'ADD'
export const UPDATE = 'UPDATE'
export const DELETE = 'DELETE'
export const IMPORT = 'IMPORT'
export const RESET = 'RESET'

export type ConnectionsAction =
  | { type: typeof ADD; connection: Connection }
  | { type: typeof UPDATE; id: string; connection: Connection }
  | { type: typeof DELETE; id: string }
  | { type: typeof IMPORT; connections: Connection[] }
  | { type: typeof RESET }

function addConnection(state: Connections, connection: Connection): Connections {
  // generate ID
  if (!connection.id) {
    connectService.generateId(connection, state)
  }

  return { ...state, [connection.id]: connection }
}

function updateConnection(state: Connections, id: string, connection: Connection): Connections {
  // name change is handled correctly, because we use id
  return { ...state, [id]: connection }
}

function deleteConnection(state: Connections, id: string): Connections {
  const newState = { ...state }
  delete newState[id]
  return newState
}

function importConnections(state: Connections, imported: Connection[]): Connections {
  return imported.reduce((newState, conn) => {
    // if there's a connection with given ID, change it, otherwise, add new one
    if (!conn.id) {
      // importing old format without ID
      connectService.generateId(conn, state)
    }
    let exists = false
    for (const c in state) {
      if (c === conn.id) {
        exists = true
        break
      }
    }
    if (exists) {
      return updateConnection(state, conn.id, conn)
    } else {
      return addConnection(newState, conn)
    }
  }, state)
}

export function reducer(state: Connections, action: ConnectionsAction): Connections {
  switch (action.type) {
    case ADD: {
      const { connection } = action
      return addConnection(state, connection)
    }
    case UPDATE: {
      const { id, connection } = action
      return updateConnection(state, id, connection)
    }
    case DELETE: {
      const { id } = action
      return deleteConnection(state, id)
    }
    case IMPORT: {
      const { connections } = action
      return importConnections(state, connections)
    }
    case RESET:
      return {}
    default:
      return state
  }
}
