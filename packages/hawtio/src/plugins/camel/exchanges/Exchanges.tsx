import React from 'react'
import { BlockedExchanges } from './BlockedExchanges'
import { InflightExchanges } from './InflightExchanges'

export const Exchanges: React.FunctionComponent = () => {
  return (
    <React.Fragment>
      <InflightExchanges />
      <BlockedExchanges />
    </React.Fragment>
  )
}
