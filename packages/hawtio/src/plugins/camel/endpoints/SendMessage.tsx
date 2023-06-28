import React, { FormEvent, useContext, useRef, useState } from 'react'
import * as monacoEditor from 'monaco-editor'
import { CamelContext } from '../context'
import xmlFormat from 'xml-formatter'

import {
  Button,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  PageSection,
  Select,
  SelectOption,
  SelectVariant,
  TextInput,
  Title,
} from '@patternfly/react-core'
import { TrashIcon } from '@patternfly/react-icons'
import { CodeEditor, Language } from '@patternfly/react-code-editor'
import { doSendMessage } from '@hawtiosrc/plugins/camel/endpoints/endpoints-service'
import { eventService, NotificationType } from '@hawtiosrc/core'
import { SelectOptionObject } from '@patternfly/react-core/src/components/Select/SelectOption'
import { headers as exchangeHeaders } from './exchange-headers-camel-model.json'
import { InputWithSuggestions } from './InputWithSuggestions'

type SendBodyMessageProps = {
  onBodyChange: (body: string) => void
}
const MessageBody: React.FunctionComponent<SendBodyMessageProps> = props => {
  const [messageBody, setMessageBody] = useState<string>('')
  const [selectedFormat, setSelectedFormat] = useState<Language>(Language.xml)
  const [isDropdownOpen, setDropdownOpen] = useState(false)
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null)

  const editorDidMount = (editor: monacoEditor.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
  }

  const handleAutoFormat = () => {
    if (editorRef.current) {
      const model = editorRef.current.getModel()
      if (model) {
        if (selectedFormat === Language.xml) {
          //monaco doesn't have built in xml formatter
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
    props.onBodyChange(body)
  }
  const handleToggle = () => {
    setDropdownOpen(!isDropdownOpen)
  }
  const handleFormatChange = (event: React.MouseEvent | React.ChangeEvent, value: string | SelectOptionObject) => {
    setSelectedFormat(value as Language)
    setDropdownOpen(false)
  }

  return (
    <>
      <FormGroup label='Message'>
        <CodeEditor
          code={messageBody}
          onEditorDidMount={editorDidMount}
          language={selectedFormat}
          height={'300px'}
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
            <Button onClick={handleAutoFormat}>Format</Button>
          </FlexItem>
        </Flex>
      </FormGroup>
    </>
  )
}

type MessageHeadersProps = {
  onHeadersChange: (headers: { name: string; value: string }[]) => void
}
const MessageHeaders: React.FunctionComponent<MessageHeadersProps> = props => {
  const [headers, setHeaders] = useState<Array<{ name: string; value: string }>>([])
  const headersSuggestions = Object.keys(exchangeHeaders as Record<string, { type: string }>)

  const handleInputChange = (index: number, newValue: string, headerName: string) => {
    const updatedHeaders = [...headers]
    updatedHeaders[index] = { ...updatedHeaders[index], [headerName]: newValue }
    setHeaders(updatedHeaders)
    props.onHeadersChange(updatedHeaders)
  }
  const handleAddHeader = () => {
    const updatedHeaders = [...headers, { name: '', value: '' }]
    setHeaders(updatedHeaders)
    props.onHeadersChange(updatedHeaders)
  }

  const handleRemoveHeader = (index: number) => {
    const updatedHeaders = [...headers]
    updatedHeaders.splice(index, 1)
    setHeaders(updatedHeaders)
    props.onHeadersChange(updatedHeaders)
  }

  return (
    <>
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
    </>
  )
}

export const SendMessage: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const messageHeaders = useRef<Array<{ name: string; value: string }>>([])
  const messageBody = useRef<string>('')

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
    if (selectedNode) {
      doSendMessage(selectedNode, messageBody.current, messageHeaders.current, createNotification)
    }
  }

  return (
    <PageSection variant='light'>
      <Title headingLevel='h1'>Send Message</Title>
      <Form onSubmit={handleSubmit}>
        <MessageHeaders onHeadersChange={updateHeaders} />
        <MessageBody onBodyChange={updateTheMessageBody} />
        <FormGroup>
          <Button type='submit' className='pf-m-1-col'>
            Send
          </Button>
        </FormGroup>
      </Form>
    </PageSection>
  )
}
