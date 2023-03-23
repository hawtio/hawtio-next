import { MBeanNode } from '@hawtiosrc/plugins/shared'
import { ActionGroup, Button, Form, FormGroup, TextInput } from '@patternfly/react-core'
import { useContext, useState } from 'react'
import { AddEndpointContext } from './add-endpoint-context'
import * as es from './endpoints-service'

export const AddEndpointURI: React.FunctionComponent = () => {
  const ctx = useContext(AddEndpointContext)
  const [componentURI, setComponentURI] = useState('')

  const handleURIChange = (uri: string) => {
    setComponentURI(uri)
  }

  const onCancelClicked = () => {
    ctx.showAddEndpoint(false)
  }

  const onSubmitClicked = () => {
    es.createEndpoint(ctx.selectedNode as MBeanNode, componentURI)
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
        <Button variant='primary' isDisabled={!componentURI || !ctx.selectedNode} onClick={onSubmitClicked}>
          Submit
        </Button>
        <Button variant='link' onClick={onCancelClicked}>
          Cancel
        </Button>
      </ActionGroup>
    </Form>
  )
}
