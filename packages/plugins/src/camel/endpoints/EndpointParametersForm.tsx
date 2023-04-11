import { parseBoolean } from '@hawtio/react/dist/util'
import {
  Checkbox,
  FormGroup,
  HelperText,
  HelperTextItem,
  Label,
  NumberInput,
  TextInput,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import React, { useContext, useEffect, useState } from 'react'
import './EndpointParametersForm.css'
import { AddEndpointContext } from './add-endpoint-context'

interface PropertySpec {
  type: string
  title: string
  required: boolean
  description: string
  defaultValue: string
  enums: string[]
}

export const EndpointParametersForm: React.FunctionComponent = () => {
  const ctx = useContext(AddEndpointContext)

  const [properties, setProperties] = useState<Record<string, PropertySpec> | null>()

  useEffect(() => {
    if (!ctx.componentSchema) {
      setProperties(null)
      return
    }

    const props = ctx.componentSchema['properties'] as Record<string, unknown>
    if (!props) {
      setProperties(null)
      return
    }

    const newProperties: Record<string, PropertySpec> = {}
    Object.entries(props as Record<string, unknown>).forEach(([key, value]) => {
      const v = value as Record<string, unknown>
      newProperties[key] = {
        type: v['type'] as string,
        title: v['title'] as string,
        required: parseBoolean(v['required'] as string),
        description: v['description'] as string,
        defaultValue: v['defaultValue'] as string,
        enums: v['enum'] as string[],
      }
    })
    setProperties(newProperties)
  }, [ctx.componentSchema])

  if (!properties) {
    return (
      <Label color='red' icon={<ExclamationCircleIcon />}>
        No schema properties defined for component {ctx.componentName}
      </Label>
    )
  }

  const onSetPropValue = (name: string, value: unknown) => {
    const valString = value as string

    const newEPParams = {
      ...ctx.endPointParameters,
    }
    newEPParams[name] = valString
    ctx.setEndPointParameters(newEPParams)
  }

  const onPlus = (name: string) => {
    let value = parseInt(ctx.endPointParameters[name])

    if (Number.isNaN(value)) {
      value = parseInt(properties[name].defaultValue)
      if (Number.isNaN(value)) value = 0
    } else {
      value = parseInt(ctx.endPointParameters[name])
    }

    onSetPropValue(name, value + 1)
  }

  const onMinus = (name: string) => {
    let value = parseInt(ctx.endPointParameters[name])

    if (Number.isNaN(value)) {
      value = parseInt(properties[name].defaultValue)
      if (Number.isNaN(value)) value = 100
    } else {
      value = parseInt(ctx.endPointParameters[name])
    }

    onSetPropValue(name, value - 1)
  }

  const numberValue = (stored: string, defValue: string): number | undefined => {
    if (!defValue) defValue = '0'

    const value = parseInt(stored)

    if (Number.isNaN(value)) return parseInt(defValue)

    return value
  }

  const inputControl = (name: string, index: number, propertySpec: PropertySpec): JSX.Element => {
    switch (propertySpec.type) {
      case 'string':
        return (
          <FormGroup
            label={propertySpec.title}
            id={name + '-' + index}
            fieldId={name + '-' + index}
            key={name + '-' + index}
          >
            <TextInput
              id={name + '-input'}
              key={index}
              value={ctx.endPointParameters[name]}
              isRequired={propertySpec.required}
              onChange={value => onSetPropValue(name, value)}
            />
            <HelperText id={name + '-helper-text'}>
              <HelperTextItem id={name + '-helper-text-item'} variant='indeterminate'>
                {propertySpec.description}
              </HelperTextItem>
            </HelperText>
          </FormGroup>
        )
      case 'integer':
        return (
          <FormGroup
            label={propertySpec.title}
            id={name + '-' + index}
            fieldId={name + '-' + index}
            key={name + '-' + index}
          >
            <NumberInput
              key={index}
              inputName={propertySpec.title}
              value={numberValue(ctx.endPointParameters[name], propertySpec.defaultValue)}
              allowEmptyInput
              onPlus={() => onPlus(name)}
              onMinus={() => onMinus(name)}
              onChange={value => onSetPropValue(name, value)}
              className={'endpoint-parameter-number-input'}
            />
            <HelperText id={name + '-helper-text'}>
              <HelperTextItem id={name + '-helper-text-item'} variant='indeterminate'>
                {propertySpec.description}
              </HelperTextItem>
            </HelperText>
          </FormGroup>
        )
      case 'boolean':
        return (
          <Checkbox
            id={name + '-' + index}
            key={index}
            label={propertySpec.title}
            isChecked={parseBoolean(ctx.endPointParameters[name])}
            isRequired={propertySpec.required}
            description={propertySpec.description}
            onChange={value => onSetPropValue(name, value)}
          />
        )
      case 'object':
        if (!propertySpec.enums)
          //
          // TODO - unsupported objects like ExceptionHandler
          //
          return <React.Fragment key={index} />

        return (
          <FormGroup
            label={propertySpec.title}
            id={name + '-' + index}
            fieldId={name + '-' + index}
            key={name + '-' + index}
          >
            <ToggleGroup>
              {propertySpec.enums.map((enumVal, index) => {
                return (
                  <ToggleGroupItem
                    id={name + '-' + index}
                    key={index}
                    name={enumVal}
                    text={enumVal}
                    isSelected={ctx.endPointParameters[name] === enumVal}
                    onChange={isSelected => {
                      if (isSelected) onSetPropValue(name, enumVal)
                    }}
                  />
                )
              })}
            </ToggleGroup>
            <HelperText id={name + '-helper-text'}>
              <HelperTextItem id={name + '-helper-text-item'} variant='indeterminate'>
                {propertySpec.description}
              </HelperTextItem>
            </HelperText>
          </FormGroup>
        )
      default:
        return <React.Fragment key={index} />
    }
  }

  return (
    <React.Fragment>
      {Object.keys(properties).map((name, index) => {
        return inputControl(name, index, properties[name])
      })}
    </React.Fragment>
  )
}
