import { MBeanNode } from '@hawtio/react'
import {
  ActionGroup,
  Button,
  Form,
  FormGroup,
  FormSection,
  Label,
  Select,
  SelectDirection,
  SelectOption,
  SelectOptionObject,
  SelectVariant,
  TextInput,
} from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import React, { ChangeEvent, MouseEvent, useContext, useEffect, useRef, useState } from 'react'
import './AddEndpointWizard.css'
import { EndpointParametersForm } from './EndpointParametersForm'
import { AddEndpointContext } from './add-endpoint-context'
import * as es from './endpoints-service'

const placeholder = 'Select Component Name'

export const AddEndpointWizard: React.FunctionComponent = () => {
  const ctx = useContext(AddEndpointContext)
  const toggleRef = useRef<HTMLButtonElement | null>()
  const [isOpen, setIsOpen] = useState(false)
  const [endPointValid, setEndpointValid] = useState<boolean>(false)

  useEffect(() => {
    if (!ctx.selectedNode || !ctx.componentName) return

    const schema = es.loadEndpointSchema(ctx.selectedNode as MBeanNode, ctx.componentName)
    ctx.setComponentSchema(schema as Record<string, unknown>)

    /*
     * lint reporting that ctx should be a dependency which it really doesn't
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.selectedNode, ctx.componentName])

  const onToggle = (isOpen: boolean) => {
    setIsOpen(isOpen)
  }

  const onSelect = (
    event: ChangeEvent<Element> | MouseEvent<Element>,
    value: string | SelectOptionObject,
    isPlaceholder?: boolean | undefined,
  ) => {
    if (placeholder === value) return

    ctx.setComponentName(value as string)
    setIsOpen(false)
    toggleRef?.current?.focus()
  }

  const onEndpointPathChanged = (value: string) => {
    ctx.setEndpointPath(value)

    const invalid = !value || value.length === 0 || !/^[a-zA-Z\d-_/:]+$/.test(value)
    setEndpointValid(!invalid)
  }

  const endpointInvalidMessage = (): string => {
    if (!ctx.endPointPath || ctx.endPointPath.length === 0) return 'Endpoint path is empty.'

    return 'Endpoint path invalid. Only alphanumeric characters, underscore, and hyphen allowed'
  }

  const onCancelClicked = () => {
    ctx.showAddEndpoint(false)
  }

  const onSubmitClicked = () => {
    es.createEndpointFromData(
      ctx.selectedNode as MBeanNode,
      ctx.componentName,
      ctx.endPointPath,
      ctx.endPointParameters,
    )
    ctx.showAddEndpoint(false)
  }

  return (
    <Form isHorizontal>
      <FormGroup label='Component' isRequired fieldId='form-component-name'>
        <Select
          toggleRef={() => toggleRef}
          variant={SelectVariant.single}
          aria-label={placeholder}
          onToggle={onToggle}
          onSelect={onSelect}
          selections={ctx.componentName}
          isOpen={isOpen}
          direction={SelectDirection.down}
          placeholderText={placeholder}
        >
          {ctx.componentNames === null
            ? []
            : ctx.componentNames.map((name, index) => {
                return <SelectOption key={index} value={name} />
              })}
        </Select>
      </FormGroup>
      {ctx.componentName && (
        <React.Fragment>
          <FormGroup label='Endpoint Path' fieldId='endpoint-path'>
            <TextInput
              id='endpoint-path-input'
              type='text'
              value={ctx.endPointPath}
              isRequired={true}
              onChange={onEndpointPathChanged}
            />
            {!endPointValid && (
              <Label color='red' icon={<ExclamationCircleIcon />} className='endpoint-invalid'>
                {endpointInvalidMessage()}
              </Label>
            )}
          </FormGroup>
          {ctx.componentSchema && (
            <FormSection title='Endpoint Parameters'>
              <EndpointParametersForm />
            </FormSection>
          )}
        </React.Fragment>
      )}
      <ActionGroup>
        <Button
          variant='primary'
          isDisabled={!ctx.selectedNode || !ctx.endPointPath || ctx.endPointPath.length === 0 || !endPointValid}
          onClick={onSubmitClicked}
        >
          Submit
        </Button>
        <Button variant='link' onClick={onCancelClicked}>
          Cancel
        </Button>
      </ActionGroup>
    </Form>
  )
}
