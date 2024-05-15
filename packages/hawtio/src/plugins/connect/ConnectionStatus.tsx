import React, { useEffect, useState } from 'react'
import { connectService, ConnectStatus } from '@hawtiosrc/plugins/shared/connect-service'
import { PluggedIcon, UnpluggedIcon } from '@patternfly/react-icons'

/**
 * Component to be displayed in HawtioHeaderToolbar for remote connection tabs
 * @constructor
 */
export const ConnectionStatus: React.FunctionComponent = () => {
  const [reachable, setReachable] = useState<ConnectStatus>('not-reachable')

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

  let icon = null
  switch (reachable) {
    case 'reachable':
      icon = <PluggedIcon color='green' />
      break
    case 'not-reachable':
      icon = <UnpluggedIcon color='red' />
      break
    case 'not-reachable-securely':
      icon = <UnpluggedIcon style={{ color: 'var(--pf-global--warning-color--100)' }} />
      break
  }

  return (
    <>
      {icon}
      {connectionName ? connectionName : ''}
    </>
  )
}
