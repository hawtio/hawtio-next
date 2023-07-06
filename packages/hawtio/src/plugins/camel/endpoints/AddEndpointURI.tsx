import { ActionGroup, Button, Form, FormGroup, TextInput } from '@patternfly/react-core'
import { useContext, useState } from 'react'
import { CamelContext } from '../context'
import { AddEndpointContext } from './context'
import * as es from './endpoints-service'

export const AddEndpointURI: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const ctx = useContext(AddEndpointContext)
  const [componentURI, setComponentURI] = useState('')

  if (!selectedNode) {
    return null
  }

  const handleURIChange = (uri: string) => {
    setComponentURI(uri)
  }

  const onCancelClicked = () => {
    ctx.showAddEndpoint(false)
  }

  const onSubmitClicked = () => {
    es.createEndpoint(selectedNode, componentURI)
    ctx.showAddEndpoint(false)
  }

  return (
    <Form>
      <FormGroup label='URI'>
        <TextInput
          isRequired
          type='text'
          id='uri-input-text'
          name='uri-input-text'
          value={componentURI}
          onChange={handleURIChange}
        />
      </FormGroup>
      <ActionGroup>
        <Button variant='primary' isDisabled={!componentURI} onClick={onSubmitClicked}>
          Submit
        </Button>
        <Button variant='link' onClick={onCancelClicked}>
          Cancel
        </Button>
      </ActionGroup>
    </Form>
  )
}
