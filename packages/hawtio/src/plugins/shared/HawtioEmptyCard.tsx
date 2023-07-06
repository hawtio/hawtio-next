import { Card, CardBody, CardTitle, Text } from '@patternfly/react-core'
import { InfoCircleIcon } from '@patternfly/react-icons'
import React from 'react'

export const HawtioEmptyCard: React.FunctionComponent<{ title?: string; message: string; testid?: string }> = ({
  title,
  message,
  testid = 'empty',
}) => (
  <Card>
    {title && <CardTitle>{title}</CardTitle>}
    <CardBody>
      <Text data-testid={testid} component='p'>
        <InfoCircleIcon /> {message}
      </Text>
    </CardBody>
  </Card>
)
