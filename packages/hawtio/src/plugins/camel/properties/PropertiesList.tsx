import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Panel,
  PanelHeader,
  PanelMain,
  PanelMainBody,
} from '@patternfly/react-core'
import React from 'react'
import './Properties.css'
import { PropertiesTooltippedName } from './PropertiesTooltippedName'
import { Property } from './property'

interface PropertiesListProps {
  title: string
  values: Property[]
}

export const PropertiesList: React.FunctionComponent<PropertiesListProps> = props => {
  return (
    <Panel variant='raised' className='properties-list-panel'>
      <PanelHeader>{props.title}</PanelHeader>
      <PanelMain>
        {(!props.values || props.values.length === 0) && (
          <PanelMainBody className='properties-no-properties'>No properties</PanelMainBody>
        )}
        {props.values && props.values.length > 0 && (
          <PanelMainBody>
            <DescriptionList columnModifier={{ default: '2Col' }}>
              {props.values.map(p => {
                return (
                  <DescriptionListGroup key={p.name}>
                    <DescriptionListTerm>
                      <PropertiesTooltippedName property={p} />
                    </DescriptionListTerm>
                    <DescriptionListDescription>{p.value}</DescriptionListDescription>
                  </DescriptionListGroup>
                )
              })}
            </DescriptionList>
          </PanelMainBody>
        )}
      </PanelMain>
    </Panel>
  )
}
