import { trimEnd } from '@hawtio/util/strings'
import { ActionGroup, Button, ClipboardCopy, ClipboardCopyVariant, DataListAction, DataListCell, DataListContent, DataListItem, DataListItemCells, DataListItemRow, DataListToggle, Dropdown, DropdownItem, DropdownPosition, Form, KebabToggle, Text, Title } from '@patternfly/react-core'
import { IJmxOperation, IJmxOperationArgument } from 'jolokia.js'
import React, { useContext, useState } from 'react'
import { MBeanTreeContext } from '../context'
import { operationService } from './operation-service'

export type OperationProps = {
  name: string
  operation: IJmxOperation
}

export const Operation: React.FunctionComponent<OperationProps> = props => {
  const { node } = useContext(MBeanTreeContext)
  const { name, operation } = props
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isFailed, setIsFailed] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  if (!node || !node.objectName || !node.mbean) {
    return null
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const copyMethodName = () => {
    // TODO: impl
  }

  const copyJolokiaURL = () => {
    // TODO: impl
  }

  const readableType = (arg: IJmxOperationArgument) => {
    const type = arg.type
    const lastDotIndex = type.lastIndexOf('.')
    let readable = lastDotIndex > 0 ? type.substring(lastDotIndex + 1) : type
    if (type.startsWith('[') && type.endsWith(';')) {
      readable = trimEnd(readable, ';') + '[]'
    }
    return readable
  }

  const readableName = (method: string, args: IJmxOperationArgument[]) => {
    const readableArgs = args.map(arg => readableType(arg)).join(', ')
    return `${method}(${readableArgs})`
  }

  const execute = async () => {
    setIsExecuting(true)
    const mbean = node.objectName
    if (!mbean) {
      setIsExecuting(false)
      return
    }
    const argValues: unknown[] = []
    try {
      const result = await operationService.execute(mbean, name, argValues)
      setIsFailed(false)
      setResult(result)
    } catch (err) {
      setIsFailed(true)
      setResult(String(err))
    } finally {
      setIsExecuting(false)
    }
  }

  const isResultHtml = () => {
    if (!result) {
      return false
    }
    return result.startsWith('<!DOCTYPE html>')
      || /^<table[^>]*>/.test(result)
      || /^<ul[^>]*>/.test(result)
  }

  return (
    <DataListItem
      key={`operation-${name}`}
      aria-labelledby={`operation ${name}`}
      isExpanded={isExpanded}
    >
      <DataListItemRow>
        <DataListToggle
          onClick={handleToggle}
          isExpanded={isExpanded}
          id="ex-toggle1"
          aria-controls="ex-expand1"
        />
        <DataListItemCells
          dataListCells={[
            <DataListCell key={`operation-cell-name-${name}`} isFilled={false}>
              <b>{readableName(name, operation.args)}</b>
            </DataListCell>,
            <DataListCell key={`operation-cell-desc-${name}`} isFilled={false}>
              {operation.desc}
            </DataListCell>
          ]}
        />
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
              <DropdownItem
                key={`operation-action-copy-method-name-${name}`}
                onClick={copyMethodName}
              >
                Copy method name
              </DropdownItem>,
              <DropdownItem
                key={`operation-action-copy-jolokia-url-${name}`}
                onClick={copyJolokiaURL}
              >
                Copy Jolokia URL
              </DropdownItem>,
            ]}
          />
        </DataListAction>
      </DataListItemRow>
      <DataListContent
        id={`operation-execute-${name}`}
        aria-label={`operation execute ${name}`}
        isHidden={!isExpanded}
      >
        {operation.args.length === 0 &&
          <Text component="p">
            This JMX operation requires no arguments. Click the <code>Execute</code> button to invoke the operation.
          </Text>
        }
        {operation.args.length > 0 &&
          <Text component="p">
            This JMX operation requires some parameters.
            Fill in the fields below and click the <code>Execute</code> button to invoke the operation.
          </Text>
        }
        <Form>
          <ActionGroup>
            <Button
              key={`operation-action-execute-${name}`}
              variant="primary"
              onClick={execute}
              isSmall
              isDisabled={isExecuting}
            >
              Execute
            </Button>
          </ActionGroup>
        </Form>
      </DataListContent>
      {result &&
        <DataListContent
          id={`operation-result-${name}`}
          aria-label={`operation result ${name}`}
          isHidden={!isExpanded}
        >
          <Title headingLevel="h4">Result</Title>
          {/*
            TODO: Known issue - "Warning: findDOMNode is deprecated in StrictMode."
            https://github.com/patternfly/patternfly-react/issues/8368
          */}
          <ClipboardCopy
            variant={ClipboardCopyVariant.expansion}
            isExpanded
            isCode
            isReadOnly
          >
            {result}
          </ClipboardCopy>
        </DataListContent>
      }
    </DataListItem>
  )
}
