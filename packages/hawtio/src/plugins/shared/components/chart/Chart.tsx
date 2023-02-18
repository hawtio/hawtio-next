import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  PageSection,
  PageSectionVariants,
  Title,
} from '@patternfly/react-core'
import { ClipboardCheckIcon } from '@patternfly/react-icons'
import { useContext } from 'react'
import { NodeProps } from '../NodeProps'

export const Chart: React.FunctionComponent<NodeProps> = (props) => {

  if (!props.node || !props.node.mbean) {
    return null
  }

  return (
    <PageSection variant={PageSectionVariants.light} isFilled>
      <EmptyState variant={EmptyStateVariant.full}>
        <EmptyStateIcon icon={ClipboardCheckIcon} />
        <Title headingLevel='h1' size='lg'>
          Under construction
        </Title>
      </EmptyState>
    </PageSection>
  )
}
