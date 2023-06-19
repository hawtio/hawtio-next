import {
  ActionGroup,
  Alert,
  AlertGroup,
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
import React, { useContext, useMemo, useState } from 'react'
import { Operation } from './operation'
import { operationService } from './operation-service'
import { PluginNodeSelectionContext } from '@hawtiosrc/plugins/selectionNodeContext'
import './OperationForm.css'

export interface OperationFormProps {
  name: string
  operation: Operation
}

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

const defaultValue = (javaType: string) => {
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

export const OperationForm: React.FunctionComponent<OperationFormProps> = props => {
  const { selectedNode } = useContext(PluginNodeSelectionContext)
  const { name, operation } = props
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [currentAlerts, setCurrentAlerts] = useState<React.ReactNode[]>([])

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCurrentAlerts(prev => [
      ...prev,
      <Alert key={`{alert-${prev.length + 1}`} isLiveRegion timeout={2000} title='Copied to clipboard' />,
    ])
  }

  const copyMethodName = () => {
    copyToClipboard(operation.readableName)
  }

  const copyJolokiaURL = async () => {
    copyToClipboard(await operationService.getJolokiaUrl(objectName, name))
  }

  const OperationActions = useMemo(
    () => (
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
    ),

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedNode?.mbean, isDropdownOpen],
  )

  if (!selectedNode || !selectedNode.objectName || !selectedNode.mbean) {
    return null
  }

  const { objectName } = selectedNode

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
    <React.Fragment>
      <AlertGroup isToast isLiveRegion>
        {currentAlerts}
      </AlertGroup>
      <DataListItem key={`operation-${name}`} aria-labelledby={`operation ${name}`} isExpanded={isExpanded}>
        <DataListItemRow>
          <DataListToggle onClick={handleToggle} isExpanded={isExpanded} id='ex-toggle1' aria-controls='ex-expand1' />
          <OperationCells />
          {OperationActions}
        </DataListItemRow>
        <OperationFormContents {...props} objectName={objectName} isExpanded={isExpanded} />
      </DataListItem>
    </React.Fragment>
  )
}

type OperationFormContentsProps = OperationFormProps & {
  objectName: string
  isExpanded: boolean
}

const OperationFormContents: React.FunctionComponent<OperationFormContentsProps> = props => {
  const { name, operation, objectName, isExpanded } = props
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
