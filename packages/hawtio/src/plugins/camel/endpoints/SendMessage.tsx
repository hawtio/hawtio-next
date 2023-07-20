import { NotificationType, eventService } from '@hawtiosrc/core'
import { isBlank } from '@hawtiosrc/util/strings'
import { CodeEditor, Language } from '@patternfly/react-code-editor'
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  Select,
  SelectOption,
  SelectOptionObject,
  SelectVariant,
  TextInput,
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
    <Card isFullHeight>
      <CardTitle>Send Message</CardTitle>
      <CardBody>
        <Form onSubmit={handleSubmit}>
          <MessageHeaders onHeadersChange={updateHeaders} />
          <MessageBody onBodyChange={updateTheMessageBody} />
          <FormGroup>
            <Button type='submit' className='pf-m-1-col'>
              Send
            </Button>
          </FormGroup>
        </Form>
      </CardBody>
    </Card>
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
        {/* eslint-disable-next-line react/jsx-no-undef */}
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
                  onChange={(newValue, event) => handleInputChange(index, newValue, 'value')}
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
          updateMessageBody(xmlFormat(messageBody))
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
  const handleToggle = () => {
    setDropdownOpen(!isDropdownOpen)
  }
  const handleFormatChange = (event: React.MouseEvent | React.ChangeEvent, value: string | SelectOptionObject) => {
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
            {' '}
            <Select
              variant={SelectVariant.single}
              aria-label='Select Format'
              onToggle={handleToggle}
              onSelect={handleFormatChange}
              selections={selectedFormat}
              isOpen={isDropdownOpen}
            >
              <SelectOption label='xml' value={Language.xml} />
              <SelectOption label='json' value={Language.json} />
              <SelectOption label='plaintext' value={Language.plaintext} />
            </Select>
          </FlexItem>{' '}
          <FlexItem flex={{ default: 'flexNone', md: 'flex_1' }}>
            <Button variant='secondary' isSmall onClick={handleAutoFormat}>
              Format
            </Button>
          </FlexItem>
        </Flex>
      </FormGroup>
    </React.Fragment>
  )
}
