import { PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

type ConnectProps = {
}

const Connect: React.FunctionComponent<ConnectProps> = props =>
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component="h1">Connect</Text>
    </TextContent>
  </PageSection>

export default Connect
