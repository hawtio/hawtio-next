import { PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

type Example2Props = {
}

const Example2: React.FunctionComponent<Example2Props> = props =>
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component="h1">Example 2</Text>
      <Text component="p">This is another example plugin.</Text>
    </TextContent>
  </PageSection>

export default Example2
