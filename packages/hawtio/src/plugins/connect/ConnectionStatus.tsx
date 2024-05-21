import React, { useEffect, useState } from 'react'
import { connectService, ConnectStatus } from '@hawtiosrc/plugins/shared/connect-service'
import { PluggedIcon, UnpluggedIcon } from '@patternfly/react-icons'
import { Icon } from '@patternfly/react-core'

/**
 * Component to be displayed in HawtioHeaderToolbar for remote connection tabs
 * @constructor
 */
export const ConnectionStatus: React.FunctionComponent = () => {
  const [reachable, setReachable] = useState<ConnectStatus>('not-reachable')
  const [username, setUsername] = useState('')

  const connectionId = connectService.getCurrentConnectionId()
  const connectionName = connectService.getCurrentConnectionName()

  useEffect(() => {
    connectService.getCurrentCredentials().then(credentials => {
      const username = credentials ? credentials.username : ''
      setUsername(username)
    })
  }, [])

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
      icon = (
        <Icon style={{ color: 'var(--pf-v5-global--success-color--100)' }}>
          <PluggedIcon />
        </Icon>
      )
      break
    case 'not-reachable':
      icon = (
        <Icon style={{ color: 'var(--pf-v5-global--danger-color--100)' }}>
          <UnpluggedIcon />
        </Icon>
      )
      break
    case 'not-reachable-securely':
      icon = (
        <Icon style={{ color: 'var(--pf-v5-global--warning-color--100)' }}>
          <PluggedIcon />
        </Icon>
      )
      break
  }

  return (
    <>
      {icon} {connectionName && connectionName} {username && `(${username})`}
    </>
  )
}
