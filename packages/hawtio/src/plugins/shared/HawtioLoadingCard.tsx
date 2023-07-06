import { Card, CardBody, Skeleton } from '@patternfly/react-core'
import React from 'react'

export const HawtioLoadingCard: React.FunctionComponent<{ message?: string; testid?: string }> = ({
  message = 'Loading...',
  testid = 'loading',
}) => (
  <Card>
    <CardBody>
      <Skeleton data-testid={testid} screenreaderText={message} />
    </CardBody>
  </Card>
)
