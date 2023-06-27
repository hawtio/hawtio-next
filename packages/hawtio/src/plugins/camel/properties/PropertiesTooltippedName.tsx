import React from 'react'
import { Tooltip } from '@patternfly/react-core'
import { InfoCircleIcon } from '@patternfly/react-icons'
import { Property } from './property'
import './properties.css'

interface PropertiesTTNameProps {
  property: Property
}

export const PropertiesTooltippedName: React.FunctionComponent<PropertiesTTNameProps> = props => {
  const tooltipRef = React.useRef<HTMLSpanElement>(null)

  return (
    <React.Fragment>
      {props.property.name}

      <span ref={tooltipRef} className='properties-name-tooltip-button'>
        <InfoCircleIcon />
      </span>
      <Tooltip id='tooltip-ref1' reference={tooltipRef} content={<div>{props.property.description}</div>} />
    </React.Fragment>
  )
}
