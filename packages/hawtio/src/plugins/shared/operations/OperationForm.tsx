import { eventService } from '@hawtiosrc/core'
import { PluginNodeSelectionContext } from '@hawtiosrc/plugins/context'
import {
  ActionGroup,
  Button,
  Checkbox,
  ClipboardCopy,
  ClipboardCopyVariant,
  DataListAction,
  DataListCell,
  DataListContent,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  DataListToggle,
  Dropdown,
  DropdownItem,
  DropdownPosition,
  Form,
  FormGroup,
  KebabToggle,
  Text,
  TextInput,
  Title,
} from '@patternfly/react-core'
import { LockIcon } from '@patternfly/react-icons'
import React, { createContext, useContext, useState } from 'react'
import './OperationForm.css'
import { Operation, OperationArgument } from './operation'
import { operationService } from './operation-service'

export const OperationContext = createContext<{
  name: string
  operation: Operation
  objectName: string
}>({
  name: '',
  operation: new Operation('', [], '', ''),
  objectName: '',
})

export const OperationForm: React.FunctionComponent<{
  name: string
  operation: Operation
}> = ({ name, operation }) => {
  const { selectedNode } = useContext(PluginNodeSelectionContext)
  const [isExpanded, setIsExpanded] = useState(false)

  if (!selectedNode || !selectedNode.objectName || !selectedNode.mbean) {
    return null
  }

  const { objectName } = selectedNode

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const operationCells = [
    <DataListCell key={`operation-cell-name-${name}`} isFilled={false}>
      <code className='operation-datatype'>{operation.readableReturnType}</code>
      <b>{operation.readableName}</b>
    </DataListCell>,
    <DataListCell key={`operation-cell-desc-${name}`} isFilled={false}>
      {operation.description}
    </DataListCell>,
  ]
  // Lock if it's not invocable
  if (!operation.canInvoke) {
    operationCells.unshift(
      <DataListCell key={`operation-cell-icon-${name}`} isIcon isFilled={false}>
        <LockIcon />
      </DataListCell>,
    )
  }

  return (
    <OperationContext.Provider value={{ name, operation, objectName }}>
      <DataListItem key={`operation-${name}`} aria-labelledby={`operation ${name}`} isExpanded={isExpanded}>
        <DataListItemRow>
          <DataListToggle onClick={handleToggle} isExpanded={isExpanded} id='ex-toggle1' aria-controls='ex-expand1' />
          <DataListItemCells dataListCells={operationCells} />
          <OperationActions />
        </DataListItemRow>
        <OperationFormContents isExpanded={isExpanded} />
      </DataListItem>
    </OperationContext.Provider>
  )
}

const OperationActions: React.FunctionComponent = () => {
  const { name, operation, objectName } = useContext(OperationContext)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const notifySuccessfulCopy = () => {
    eventService.notify({
      type: 'success',
      message: 'Copied to clipboard',
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    notifySuccessfulCopy()
  }

  const copyMethodName = () => {
    copyToClipboard(operation.readableName)
  }

  const copyJolokiaURL = async () => {
    copyToClipboard(await operationService.getJolokiaUrl(objectName, name))
  }

  return (
    <DataListAction
      id={`operation-actions-${name}`}
      aria-label={`operation actions ${name}`}
      aria-labelledby={`${name} operation-actions-${name}`}
    >
      <Dropdown
        key={`operation-action-dropdown-${name}`}
        isPlain
        position={DropdownPosition.right}
        isOpen={isDropdownOpen}
        toggle={<KebabToggle onToggle={handleDropdownToggle} />}
        dropdownItems={[
          <DropdownItem key={`operation-action-copy-method-name-${name}`} onClick={copyMethodName}>
            Copy method name
          </DropdownItem>,
          <DropdownItem key={`operation-action-copy-jolokia-url-${name}`} onClick={copyJolokiaURL}>
            Copy Jolokia URL
          </DropdownItem>,
        ]}
      />
    </DataListAction>
  )
}

const OperationFormContents: React.FunctionComponent<{ isExpanded: boolean }> = ({ isExpanded }) => {
  const { name } = useContext(OperationContext)
  const [isFailed, setIsFailed] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  // TODO: impl HTML escaping
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isResultHtml = () => {
    if (!result) {
      return false
    }
    return result.startsWith('<!DOCTYPE html>') || /^<table[^>]*>/.test(result) || /^<ul[^>]*>/.test(result)
  }

  const OperationExecuteResult = () => (
    <React.Fragment>
      <Title headingLevel='h4'>Result</Title>
      <ClipboardCopy
        variant={ClipboardCopyVariant.expansion}
        isExpanded
        isCode
        isReadOnly
        removeFindDomNode
        className={isFailed ? 'jmx-operation-error' : ''}
      >
        {result}
      </ClipboardCopy>
    </React.Fragment>
  )

  return (
    <React.Fragment>
      <DataListContent id={`operation-execute-${name}`} aria-label={`operation execute ${name}`} isHidden={!isExpanded}>
        <OperationExecuteForm setResult={setResult} setIsFailed={setIsFailed} />
      </DataListContent>
      {result && (
        <DataListContent id={`operation-result-${name}`} aria-label={`operation result ${name}`} isHidden={!isExpanded}>
          <OperationExecuteResult />
        </DataListContent>
      )}
    </React.Fragment>
  )
}

function defaultValue(javaType: string): unknown {
  switch (javaType) {
    case 'boolean':
    case 'java.lang.Boolean':
      return false
    case 'int':
    case 'long':
    case 'java.lang.Integer':
    case 'java.lang.Long':
      return 0
    default:
      return ''
  }
}

const OperationExecuteForm: React.FunctionComponent<{
  setResult: (result: string) => void
  setIsFailed: (failed: boolean) => void
}> = ({ setResult, setIsFailed }) => {
  const { name, operation, objectName } = useContext(OperationContext)
  const [isExecuting, setIsExecuting] = useState(false)

  const [argValues, setArgValues] = useState<unknown[]>(operation.args.map(arg => defaultValue(arg.type)))

  const updateArgValues = (index: number) => (value: boolean | string) => {
    const values = [...argValues]
    values[index] = value
    setArgValues(values)
  }

  const processResult = (result: unknown) => {
    if (operation.returnType === 'void' && (!result || result === 'null')) {
      return 'Operation successful'
    }
    switch (typeof result) {
      case 'boolean':
        return result.toString()
      case 'string': {
        const trimmed = result.trim()
        if (trimmed === '') {
          return 'Empty string'
        }
        return trimmed
      }
      default:
        return JSON.stringify(result, null, 2)
    }
  }

  const execute = async () => {
    setIsExecuting(true)
    try {
      const result = await operationService.execute(objectName, name, argValues)
      setIsFailed(false)
      setResult(processResult(result))
    } catch (err) {
      setIsFailed(true)
      setResult(String(err))
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <Form isHorizontal={operation.args.length > 0}>
      {operation.args.length === 0 && (
        <Text component='p'>
          This JMX operation requires no arguments. Click the <code>Execute</code> button to invoke the operation.
        </Text>
      )}
      {operation.args.length > 0 && (
        <Text component='p'>
          This JMX operation requires some parameters. Fill in the fields below and click the <code>Execute</code>{' '}
          button to invoke the operation.
        </Text>
      )}
      {operation.args.map((arg, index) => (
        <FormGroup
          key={`operation-${name}-form-${arg.name}-${index}`}
          label={arg.name}
          fieldId={`operation-${name}-form-${arg.name}-${index}`}
          helperText={arg.helpText()}
        >
          <ArgFormInput
            key={`operation-${name}-arg-form-${arg.name}-${index}`}
            opName={name}
            arg={arg}
            index={index}
            canInvoke={operation.canInvoke}
            argValues={argValues}
            updateArgValues={updateArgValues}
          />
        </FormGroup>
      ))}
      <ActionGroup>
        <Button
          key={`operation-action-execute-${name}`}
          variant='primary'
          onClick={execute}
          isSmall
          isDisabled={!operation.canInvoke || isExecuting}
        >
          Execute
        </Button>
      </ActionGroup>
    </Form>
  )
}

const ArgFormInput: React.FunctionComponent<{
  opName: string
  arg: OperationArgument
  index: number
  canInvoke: boolean
  argValues: unknown[]
  updateArgValues: (index: number) => (value: boolean | string) => void
}> = ({ opName, arg, index, canInvoke, argValues, updateArgValues }) => {
  const id = `operation-${opName}-arg-form-input-${arg.name}-${index}`
  const value = argValues[index]
  switch (arg.type) {
    case 'boolean':
    case 'java.lang.Boolean':
      return <Checkbox id={id} isChecked={Boolean(value)} onChange={updateArgValues(index)} isDisabled={!canInvoke} />
    case 'int':
    case 'long':
    case 'java.lang.Integer':
    case 'java.lang.Long':
      return (
        <TextInput
          id={id}
          type='number'
          value={Number(value)}
          onChange={updateArgValues(index)}
          isDisabled={!canInvoke}
        />
      )

    default:
      return (
        <TextInput
          id={id}
          type='text'
          value={String(value)}
          onChange={updateArgValues(index)}
          isDisabled={!canInvoke}
        />
      )
  }
}
