import { Alert, Card, CardBody, CardTitle } from '@patternfly/react-core'
import React from 'react'

export const HawtioEmptyCard: React.FunctionComponent<{
  title?: string
  message: string
  testid?: string
}> = ({ title, message, testid = 'empty' }) => (
  <Card isPlain>
    {title && <CardTitle>{title}</CardTitle>}
    <CardBody>
      <Alert isInline isPlain variant='info' data-testid={testid} title={message} />
    </CardBody>
  </Card>
)
