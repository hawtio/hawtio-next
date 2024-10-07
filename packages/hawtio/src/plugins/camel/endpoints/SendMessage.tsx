import { NotificationType, eventService } from '@hawtiosrc/core'
import { isBlank } from '@hawtiosrc/util/strings'
import { CodeEditor, Language } from '@patternfly/react-code-editor'
import {
  Button,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  MenuToggle,
  MenuToggleElement,
  Panel,
  PanelHeader,
  PanelMain,
  PanelMainBody,
  Select,
  SelectList,
  SelectOption,
  TextInput,
  Title,
} from '@patternfly/react-core'

import { TrashIcon } from '@patternfly/react-icons'
import * as monacoEditor from 'monaco-editor'
import React, { FormEvent, useContext, useRef, useState } from 'react'
import xmlFormat from 'xml-formatter'
import { CamelContext } from '../context'
import { InputWithSuggestions } from './InputWithSuggestions'
import { doSendMessage } from './endpoints-service'
// TODO: Parameterise the version of Camel mode for the exchange headers
import { headers as exchangeHeaders } from './exchange-headers-camel-model.json'

export const SendMessage: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const messageHeaders = useRef<{ name: string; value: string }[]>([])
  const messageBody = useRef('')

  if (!selectedNode) {
    return null
  }

  const updateHeaders = (headers: { name: string; value: string }[]) => {
    messageHeaders.current = [...headers]
  }

  const updateTheMessageBody = (body: string) => {
    messageBody.current = body
  }

  const createNotification = (type: NotificationType, message: string) => {
    eventService.notify({
      type: type,
      message: message,
    })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    doSendMessage(selectedNode, messageBody.current, messageHeaders.current, createNotification)
  }

  return (
    <Panel>
      <PanelHeader>
        <Title headingLevel='h3'>Send Message</Title>
      </PanelHeader>

      <PanelMain>
        <PanelMainBody>
          <Form onSubmit={handleSubmit}>
            <MessageHeaders onHeadersChange={updateHeaders} />
            <MessageBody onBodyChange={updateTheMessageBody} />
            <FormGroup>
              <Button type='submit' className='pf-m-1-col'>
                Send
              </Button>
            </FormGroup>
          </Form>
        </PanelMainBody>
      </PanelMain>
    </Panel>
  )
}

const MessageHeaders: React.FunctionComponent<{
  onHeadersChange: (headers: { name: string; value: string }[]) => void
}> = ({ onHeadersChange }) => {
  const [headers, setHeaders] = useState<{ name: string; value: string }[]>([])
  const headersSuggestions = Object.keys(exchangeHeaders as Record<string, { type: string }>)

  const handleInputChange = (index: number, newValue: string, headerName: string) => {
    const updatedHeaders = [...headers]
    const updatedHeader = updatedHeaders[index]
    if (updatedHeader) {
      updatedHeaders[index] = { ...updatedHeader, [headerName]: newValue }
      setHeaders(updatedHeaders)
      onHeadersChange(updatedHeaders)
    }
  }
  const handleAddHeader = () => {
    const updatedHeaders = [...headers, { name: '', value: '' }]
    setHeaders(updatedHeaders)
    onHeadersChange(updatedHeaders)
  }

  const handleRemoveHeader = (index: number) => {
    const updatedHeaders = [...headers]
    updatedHeaders.splice(index, 1)
    setHeaders(updatedHeaders)
    onHeadersChange(updatedHeaders)
  }

  return (
    <React.Fragment>
      <FormGroup>
        <Button variant='link' onClick={handleAddHeader}>
          Add Headers
        </Button>
      </FormGroup>
      <FormGroup>
        {headers.length > 0 && (
          <Flex>
            <FlexItem flex={{ default: 'flexNone', md: 'flex_2' }}>Name</FlexItem>
            <FlexItem flex={{ default: 'flexNone', md: 'flex_2' }}>Value</FlexItem>
            <FlexItem flex={{ default: 'flexNone', md: 'flex_1' }}></FlexItem>
          </Flex>
        )}

        {headers.length > 0 &&
          headers.map((header, index) => (
            <Flex key={index}>
              <FlexItem flex={{ default: 'flexNone', md: 'flex_2' }}>
                <InputWithSuggestions
                  aria-label={'name-input-' + index}
                  suggestions={headersSuggestions}
                  value={header.name}
                  onChange={newValue => handleInputChange(index, newValue, 'name')}
                />
              </FlexItem>
              <FlexItem flex={{ default: 'flexNone', md: 'flex_2' }}>
                <TextInput
                  type='text'
                  name='value'
                  aria-label={'value-input-' + index}
                  value={header.value}
                  onChange={(event, newValue) => handleInputChange(index, newValue, 'value')}
                />
              </FlexItem>
              <FlexItem flex={{ default: 'flexNone', md: 'flex_1' }} span={4}>
                <Button variant='link' onClick={() => handleRemoveHeader(index)} aria-label='Remove Header'>
                  <TrashIcon />
                </Button>
              </FlexItem>
            </Flex>
          ))}
      </FormGroup>
    </React.Fragment>
  )
}

const MessageBody: React.FunctionComponent<{
  onBodyChange: (body: string) => void
}> = ({ onBodyChange }) => {
  const [messageBody, setMessageBody] = useState<string>('')
  const [selectedFormat, setSelectedFormat] = useState<Language>(Language.xml)
  const [isDropdownOpen, setDropdownOpen] = useState(false)
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null)

  const editorDidMount = (editor: monacoEditor.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
  }

  const handleAutoFormat = () => {
    if (isBlank(messageBody)) {
      return
    }

    if (editorRef.current) {
      const model = editorRef.current.getModel()
      if (model) {
        if (selectedFormat === Language.xml) {
          // monaco doesn't have built in xml formatter
          try {
            updateMessageBody(xmlFormat(messageBody))
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            eventService.notify({
              type: 'danger',
              message: 'Failed to format XML',
            })
          }
        } else {
          const range = model.getFullModelRange()
          editorRef.current.trigger('', 'editor.action.formatDocument', { range })
        }
      }
    }
  }

  const updateMessageBody = (body: string) => {
    setMessageBody(body)
    onBodyChange(body)
  }

  const handleFormatChange = (_event?: React.MouseEvent<Element, MouseEvent>, value?: string | number) => {
    setSelectedFormat(value as Language)
    setDropdownOpen(false)
  }

  return (
    <React.Fragment>
      <FormGroup label='Message'>
        <CodeEditor
          code={messageBody}
          onEditorDidMount={editorDidMount}
          language={selectedFormat}
          height='300px'
          onChange={updateMessageBody}
        />
      </FormGroup>
      <FormGroup>
        <Flex>
          <FlexItem flex={{ default: 'flexNone', md: 'flex_2' }}>
            <Select
              aria-label='Select Format'
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle aria-label='options-menu' ref={toggleRef} onClick={() => setDropdownOpen(!isDropdownOpen)}>
                  {selectedFormat}
                </MenuToggle>
              )}
              onOpenChange={setDropdownOpen}
              onSelect={handleFormatChange}
              selected={selectedFormat}
              isOpen={isDropdownOpen}
            >
              <SelectList>
                <SelectOption label='xml' value={Language.xml}>
                  {Language.xml}
                </SelectOption>
                <SelectOption label='json' value={Language.json}>
                  {Language.json}
                </SelectOption>
                <SelectOption label='plaintext' value={Language.plaintext}>
                  {Language.plaintext}
                </SelectOption>
              </SelectList>
            </Select>
          </FlexItem>
          <FlexItem flex={{ default: 'flexNone', md: 'flex_1' }}>
            <Button variant='secondary' size='sm' onClick={handleAutoFormat}>
              Format
            </Button>
          </FlexItem>
        </Flex>
      </FormGroup>
    </React.Fragment>
  )
}
