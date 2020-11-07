import { PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

type Example3Props = {
}

const Example3: React.FunctionComponent<Example3Props> = props =>
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component="h1">Example 3</Text>
      <Text component="p">This is yet another example plugin.</Text>
    </TextContent>
  </PageSection>

export default Example3
