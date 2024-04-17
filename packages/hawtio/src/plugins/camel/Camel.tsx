import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  PageSection,
  PageSectionVariants,
  Spinner,
  Title,
} from '@patternfly/react-core'
import { CubesIcon } from '@patternfly/react-icons'
import React from 'react'
import Split from 'react-split'
import './Camel.css'
import { CamelContent } from './CamelContent'
import { CamelTreeView } from './CamelTreeView'
import { CamelContext, useCamelTree } from './context'

export const Camel: React.FunctionComponent = () => {
  const { tree, loaded, selectedNode, setSelectedNode } = useCamelTree()

  if (!loaded) {
    return (
      <PageSection>
        <Spinner isSVG aria-label='Loading Camel Contexts tree' />
      </PageSection>
    )
  }

  if (tree.isEmpty()) {
    return (
      <PageSection variant={PageSectionVariants.light}>
        <EmptyState variant={EmptyStateVariant.full}>
          <EmptyStateIcon icon={CubesIcon} />
          <Title headingLevel='h1' size='lg'>
            No Camel Contexts found
          </Title>
        </EmptyState>
      </PageSection>
    )
  }

  return (
    <CamelContext.Provider value={{ tree, selectedNode, setSelectedNode }}>
      <Split className='camel-split' sizes={[25, 75]} minSize={200} gutterSize={5}>
        <div>
          <CamelTreeView />
        </div>
        <div className='camel-content-page'>
          <CamelContent />
        </div>
      </Split>
    </CamelContext.Provider>
  )
}
