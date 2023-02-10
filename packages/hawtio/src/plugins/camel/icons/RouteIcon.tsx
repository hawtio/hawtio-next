import React from 'react'
import routeSvg from './svg/camel-route.svg'

const RouteIcon = ({ size = 16 }) => {
  return <img src={routeSvg} width={size + 'px'} height={size + 'px'} alt='Route Icon' />
}

export { RouteIcon }
