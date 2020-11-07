import { PageSection, PageSectionVariants, Text, TextContent } from '@patternfly/react-core'
import React from 'react'

type Example1Props = {
}

const Example1: React.FunctionComponent<Example1Props> = props =>
  <PageSection variant={PageSectionVariants.light}>
    <TextContent>
      <Text component="h1">Example 1</Text>
      <Text component="p">This is an example plugin.</Text>
    </TextContent>
  </PageSection>

export default Example1
