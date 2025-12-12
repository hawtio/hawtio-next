import { connectService, ConnectStatus } from '@hawtiosrc/plugins/shared/connect-service'
import { Label, Tooltip } from '@patternfly/react-core'
import React, { useEffect, useState } from 'react'

/**
 * Component to be displayed in HawtioHeaderToolbar for remote connection tabs
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

  const name = [connectionName, username].filter(Boolean).join(' ')

  switch (reachable) {
    case 'reachable':
      return (
        <Tooltip content={`Connected successfully`} position='bottom'>
          <Label status='success'>{name}</Label>
        </Tooltip>
      )
    case 'not-reachable':
      return (
        <Tooltip content={`Connection is not reachable`} position='bottom'>
          <Label status='danger'>{name}</Label>
        </Tooltip>
      )
    case 'not-reachable-securely':
      return (
        <Tooltip content={`Connection is reachable but not securely`} position='bottom'>
          <Label status='warning'>{name}</Label>
        </Tooltip>
      )
  }
}
