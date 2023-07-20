import {
  ActionGroup,
  Button,
  Form,
  FormGroup,
  FormSection,
  Select,
  SelectDirection,
  SelectOption,
  SelectOptionObject,
  SelectVariant,
  TextInput,
} from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import React, { ChangeEvent, MouseEvent, useContext, useEffect, useRef, useState } from 'react'
import { CamelContext } from '../context'
import { EndpointParametersForm } from './EndpointParametersForm'
import { AddEndpointContext } from './context'
import * as es from './endpoints-service'

const placeholder = 'Select Component Name'

export const AddEndpointWizard: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const ctx = useContext(AddEndpointContext)
  const toggleRef = useRef<HTMLButtonElement | null>()
  const [isOpen, setIsOpen] = useState(false)
  const [endpointValidated, setEndpointValidated] = useState<'success' | 'error' | 'default'>('default')

  useEffect(() => {
    if (!selectedNode || !ctx.componentName) return

    const schema = es.loadEndpointSchema(selectedNode, ctx.componentName)
    if (schema) {
      ctx.setComponentSchema(schema)
    }

    /*
     * lint reporting that ctx should be a dependency which it really doesn't
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode, ctx.componentName])

  if (!selectedNode) {
    return null
  }

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
    setEndpointValidated(invalid ? 'error' : 'success')
  }

  const endpointInvalidMessage = (): string => {
    if (!ctx.endpointPath || ctx.endpointPath.length === 0) return 'Endpoint path is empty.'

    return 'Endpoint path invalid. Only alphanumeric characters, underscore, and hyphen allowed'
  }

  const onCancelClicked = () => {
    ctx.showAddEndpoint(false)
  }

  const onSubmitClicked = () => {
    es.createEndpointFromData(selectedNode, ctx.componentName, ctx.endpointPath, ctx.endpointParameters)
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
          {ctx.componentNames?.map((name, index) => <SelectOption key={index} value={name} />) ?? []}
        </Select>
      </FormGroup>
      {ctx.componentName && (
        <React.Fragment>
          <FormGroup
            label='Endpoint Path'
            fieldId='endpoint-path'
            validated={endpointValidated}
            helperTextInvalid={endpointInvalidMessage()}
            helperTextInvalidIcon={<ExclamationCircleIcon />}
          >
            <TextInput
              id='endpoint-path-input'
              type='text'
              value={ctx.endpointPath}
              isRequired={true}
              onChange={onEndpointPathChanged}
              validated={endpointValidated}
            />
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
          isDisabled={!ctx.endpointPath || ctx.endpointPath.length === 0 || endpointValidated !== 'success'}
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
