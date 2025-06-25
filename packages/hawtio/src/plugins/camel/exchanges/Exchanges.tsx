import React from 'react'
import { BlockedExchanges } from './BlockedExchanges'
import { InflightExchanges } from './InflightExchanges'
import { Panel } from '@patternfly/react-core'

export const Exchanges: React.FunctionComponent = () => {
  return (
    <Panel>
      <InflightExchanges />
      <BlockedExchanges />
    </Panel>
  )
}
