import { eventService } from '@hawtiosrc/core'
import { PluginNodeSelectionContext } from '@hawtiosrc/plugins/selectionNodeContext'
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
import React, { useContext, useState } from 'react'
import './OperationForm.css'
import { Operation } from './operation'
import { operationService } from './operation-service'

const ArgFormInput: React.FunctionComponent<{
  javaType: string
  index: number
  opName: string
  argValues: unknown[]
  updateArgValues: (index: number) => (value: boolean | string) => void
}> = ({ javaType, index, opName, argValues, updateArgValues }) => {
  const id = `operation-${opName}-form-log-buffer-input`
  const value = argValues[index]
  switch (javaType) {
    case 'boolean':
    case 'java.lang.Boolean':
      return <Checkbox id={id} isChecked={Boolean(value)} onChange={updateArgValues(index)} />
    case 'int':
    case 'long':
    case 'java.lang.Integer':
    case 'java.lang.Long':
      return <TextInput id={id} type='number' value={Number(value)} onChange={updateArgValues(index)} />

    default:
      return <TextInput id={id} type='text' value={String(value)} onChange={updateArgValues(index)} />
  }
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
  objectName: string
  name: string
  operation: Operation
  setResult: (result: string) => void
  setIsFailed: (failed: boolean) => void
}> = ({ objectName, name, operation, setResult, setIsFailed }) => {
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
          key={arg.name + index}
          label={arg.name}
          fieldId={`operation-${name}-form-${arg.name}`}
          helperText={arg.helpText()}
        >
          <ArgFormInput
            key={'input-' + arg.name + '-' + index}
            javaType={arg.type}
            index={index}
            opName={name}
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
          isDisabled={isExecuting}
        >
          Execute
        </Button>
      </ActionGroup>
    </Form>
  )
}

const OperationActions = ({
  operation,
  name,
  objectName,
}: {
  operation: Operation
  name: string
  objectName: string
}) => {
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

  const OperationCells = () => (
    <DataListItemCells
      dataListCells={[
        <DataListCell key={`operation-cell-name-${name}`} isFilled={false}>
          <code className='operation-datatype'>{operation.getReadableReturnType()}</code>
          <b>{operation.readableName}</b>
        </DataListCell>,
        <DataListCell key={`operation-cell-desc-${name}`} isFilled={false}>
          {operation.description}
        </DataListCell>,
      ]}
    />
  )

  return (
    <DataListItem key={`operation-${name}`} aria-labelledby={`operation ${name}`} isExpanded={isExpanded}>
      <DataListItemRow>
        <DataListToggle onClick={handleToggle} isExpanded={isExpanded} id='ex-toggle1' aria-controls='ex-expand1' />
        <OperationCells />
        <OperationActions name={name} operation={operation} objectName={objectName} />
      </DataListItemRow>
      <OperationFormContents name={name} operation={operation} objectName={objectName} isExpanded={isExpanded} />
    </DataListItem>
  )
}

const OperationFormContents: React.FunctionComponent<{
  name: string
  operation: Operation
  objectName: string
  isExpanded: boolean
}> = ({ name, operation, objectName, isExpanded }) => {
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
        <OperationExecuteForm
          setResult={setResult}
          name={name}
          operation={operation}
          objectName={objectName}
          setIsFailed={setIsFailed}
        />
      </DataListContent>
      {result && (
        <DataListContent id={`operation-result-${name}`} aria-label={`operation result ${name}`} isHidden={!isExpanded}>
          <OperationExecuteResult />
        </DataListContent>
      )}
    </React.Fragment>
  )
}
