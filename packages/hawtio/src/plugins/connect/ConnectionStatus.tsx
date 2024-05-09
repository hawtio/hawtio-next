import React, { useEffect, useState } from 'react'
import { connectService } from '@hawtiosrc/plugins/shared/connect-service'
import { PluggedIcon, UnpluggedIcon } from '@patternfly/react-icons'

/**
 * Component to be displayed in HawtioHeaderToolbar for remote connection tabs
 * @constructor
 */
export const ConnectionStatus: React.FunctionComponent = () => {
  const [reachable, setReachable] = useState(false)

  const connectionId = connectService.getCurrentConnectionId()
  const connectionName = connectService.getCurrentConnectionName()

  useEffect(() => {
    const check = async () => {
      const connection = await connectService.getCurrentConnection()
      if (connection) {
        connectService.checkReachable(connection).then(result => setReachable(result))
      }
    }
    check() // initial fire
    const timer = setInterval(check, 20000)
    return () => clearInterval(timer)
  }, [connectionId])

  return (
    <>
      {reachable ? <PluggedIcon color='green' /> : <UnpluggedIcon color='red' />}
      {connectionName ? connectionName : ''}
    </>
  )
}
