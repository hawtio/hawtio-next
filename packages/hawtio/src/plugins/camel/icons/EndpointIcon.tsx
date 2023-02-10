import React from 'react'
import endpointSvg from './svg/endpoint-node.svg'

const EndPointIcon = ({ size = 16 }) => {
  return <img src={endpointSvg} width={size + 'px'} height={size + 'px'} alt='EndPoint Icon' />
}

export { EndPointIcon }
