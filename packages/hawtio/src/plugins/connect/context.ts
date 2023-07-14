import { Connections, connectService } from '@hawtiosrc/plugins/shared/connect-service'
import React, { createContext, useEffect, useReducer } from 'react'
import { ConnectionsAction, reducer } from './connections'

/**
 * Custom React hook for using connections and their reducer.
 */
export function useConnections() {
  const [connections, dispatch] = useReducer(reducer, connectService.loadConnections())

  useEffect(() => {
    connectService.saveConnections(connections)
  }, [connections])

  return { connections, dispatch }
}

type ConnectContext = {
  connections: Connections
  dispatch: React.Dispatch<ConnectionsAction>
}

export const ConnectContext = createContext<ConnectContext>({
  connections: {},
  dispatch: () => {
    /* no-op */
  },
})
