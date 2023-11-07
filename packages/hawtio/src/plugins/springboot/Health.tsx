import React from 'react'
import { Card, CardBody, CardHeader, Grid, GridItem, PageSection, Title } from '@patternfly/react-core'
import { loadHealth } from '@hawtiosrc/plugins/springboot/springboot-service'

export const Health: React.FunctionComponent = () => {
  loadHealth()
  return (
    <PageSection variant='light'>
      <Grid hasGutter span={12}>
        <GridItem>
          <Card>
            <CardHeader>
              <Title headingLevel='h2'>System</Title>
            </CardHeader>
            <CardBody></CardBody>
          </Card>
          <Card>
            <CardHeader>
              <Title headingLevel='h2'>System</Title>
            </CardHeader>
            <CardBody></CardBody>
          </Card>
        </GridItem>
      </Grid>
    </PageSection>
  )
}
