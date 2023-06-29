import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Label,
  LabelGroup,
  Panel,
  PanelMain,
  PanelMainBody,
  Skeleton,
  Text,
} from '@patternfly/react-core'
import { InfoCircleIcon } from '@patternfly/react-icons'
import React, { useContext, useEffect, useState } from 'react'
import Logger from 'js-logger'
import { CamelContext } from '../context'
import { log, xmlNodeLocalName } from '../globals'
import { schemaService } from '../schema-service'
import { routesService } from '../routes-service'
import * as pps from './properties-service'
import { PropertiesList } from './PropertiesList'
import { Property } from './property'
import './properties.css'

export const Properties: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const [isReading, setIsReading] = useState(true)

  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState<React.ReactNode>()
  const [labels, setLabels] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [definedProperties, setDefinedProperties] = useState<Property[]>([])
  const [defaultProperties, setDefaultProperties] = useState<Property[]>([])
  const [undefinedProperties, setUndefinedProperties] = useState<Property[]>([])

  useEffect(() => {
    if (!selectedNode) return

    setIsReading(true)

    const init = async () => {
      const localName: string = selectedNode.getProperty(xmlNodeLocalName)
      const schemaKey = localName ? localName : selectedNode.name
      const schema = schemaService.getSchema(schemaKey)

      let newTitle = localName
      let newIcon = selectedNode.icon
      let newDescription = ''
      let groups: string[] = []

      if (schema) {
        newTitle = schema['title'] as string
        newIcon = routesService.getIcon(schema, 24)
        newDescription = schema['description'] as string
        const groupStr = schema['group'] as string
        groups = groupStr.split(',')

        if (log.enabledFor(Logger.DEBUG)) {
          log.debug('Properties - schema:', JSON.stringify(schema, null, '  '))
        }

        const schemaProps = schema['properties'] as Record<string, Record<string, string>>
        pps.populateProperties(selectedNode, schemaProps)

        setDefinedProperties(pps.getDefinedProperties(schemaProps))
        setDefaultProperties(pps.getDefaultProperties(schemaProps))
        setUndefinedProperties(pps.getUndefinedProperties(schemaProps))
      }

      setIcon(newIcon)
      setTitle(newTitle)
      setDescription(newDescription)
      setLabels(groups)

      setIsReading(false)
    }

    init()
  }, [selectedNode])

  if (!selectedNode) {
    return (
      <Card>
        <CardBody>
          <Text component='p'>No selection has been made</Text>
        </CardBody>
      </Card>
    )
  }

  if (isReading) {
    return (
      <Card>
        <CardBody>
          <Skeleton data-testid='loading' screenreaderText='Loading...' />
        </CardBody>
      </Card>
    )
  }

  return (
    <Card isFullHeight>
      <CardHeader>
        <CardTitle>Properties</CardTitle>
      </CardHeader>
      <CardBody id='properties-card-body'>
        <Panel variant='raised'>
          <PanelMain>
            <PanelMainBody id='properties-card-title-panel'>
              {icon}
              <span>{title}</span>
              <LabelGroup id='properties-card-title-panel-labelgroup'>
                {labels.map(label => (
                  <Label key={label} icon={<InfoCircleIcon />}>
                    {label}
                  </Label>
                ))}
              </LabelGroup>
            </PanelMainBody>
          </PanelMain>
        </Panel>
        {description && (
          <Panel variant='raised'>
            <PanelMain>
              <PanelMainBody id='properties-card-description-panel'>{description}</PanelMainBody>
            </PanelMain>
          </Panel>
        )}
        <PropertiesList title='Defined Properties' values={definedProperties} />
        <PropertiesList title='Default Properties' values={defaultProperties} />
        <PropertiesList title='Undefined Properties' values={undefinedProperties} />
      </CardBody>
    </Card>
  )
}
