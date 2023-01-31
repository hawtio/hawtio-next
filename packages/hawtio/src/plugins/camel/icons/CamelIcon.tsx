import React from 'react'
import camelSvg from './svg/camel.svg'

const CamelIcon = ({ size = 16 }) => {
  return (
    <img src={camelSvg}
         width={size + 'px'} height={size + 'px'}
         alt="Camel Icon"
    />
  )
}

export { CamelIcon }
