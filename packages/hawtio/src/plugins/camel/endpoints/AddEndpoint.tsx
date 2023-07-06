import { Button, Card, CardBody, CardTitle, Form, FormGroup, Text } from '@patternfly/react-core'
import React, { useContext, useState } from 'react'
import { CamelContext } from '../context'
import { AddEndpointURI } from './AddEndpointURI'
import { AddEndpointWizard } from './AddEndpointWizard'
import { AddEndpointContext } from './context'

export const AddEndpoint: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const ctx = useContext(AddEndpointContext)
  const [createFrom, setCreateFrom] = useState('')

  if (!selectedNode) {
    return (
      <Card>
        <CardBody>
          <Text component='p'>No selection has been made</Text>
        </CardBody>
      </Card>
    )
  }

  const onCreateFromURIClicked = () => {
    setCreateFrom('URI')
  }

  const onCreateFromDataClicked = () => {
    setCreateFrom('DATA')
  }

  const chooseWizard = (): JSX.Element => {
    if ((ctx.componentNames && ctx.componentNames.length === 0) || createFrom === 'URI') return <AddEndpointURI />
    else if (createFrom === 'DATA') return <AddEndpointWizard />
    else {
      return (
        <Form>
          <FormGroup fieldId='create-from-radio-group' isInline label='How do you want to create your endpoint?'>
            <Button variant='secondary' onClick={onCreateFromURIClicked}>
              From URI
            </Button>
            <Button variant='secondary' onClick={onCreateFromDataClicked}>
              From Data
            </Button>
          </FormGroup>
        </Form>
      )
    }
  }

  return (
    <Card>
      <CardTitle>Add Endpoint</CardTitle>
      <CardBody>{chooseWizard()}</CardBody>
    </Card>
  )
}
