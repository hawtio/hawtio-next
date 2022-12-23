import { EmptyState, EmptyStateIcon, EmptyStateVariant, PageSection, PageSectionVariants, Title } from '@patternfly/react-core'
import { ClipboardCheckIcon } from '@patternfly/react-icons'
import { useContext } from 'react'
import { MBeanTreeContext } from '../context'

export const Chart: React.FunctionComponent = () => {
  const { node } = useContext(MBeanTreeContext)

  if (!node || !node.mbean) {
    return null
  }

  return (
    <PageSection variant={PageSectionVariants.light} isFilled>
      <EmptyState variant={EmptyStateVariant.full}>
        <EmptyStateIcon icon={ClipboardCheckIcon} />
        <Title headingLevel="h1" size="lg">Under construction</Title>
      </EmptyState>
    </PageSection>
  )
}
