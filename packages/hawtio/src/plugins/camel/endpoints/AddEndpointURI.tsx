import { ActionGroup, Button, Form, FormGroup, TextInput } from '@patternfly/react-core'
import { useContext, useState } from 'react'
import { CamelContext } from '../context'
import { AddEndpointContext } from './context'
import * as es from './endpoints-service'

export const AddEndpointURI: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const { showAddEndpoint } = useContext(AddEndpointContext)
  const [componentURI, setComponentURI] = useState('')

  if (!selectedNode) {
    return null
  }

  const onCancelClicked = () => {
    showAddEndpoint(false)
  }

  const onSubmitClicked = () => {
    es.createEndpoint(selectedNode, componentURI)
    showAddEndpoint(false)
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
          onChange={(_event, uri) => setComponentURI(uri)}
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
