import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  PageSection,
  PageSectionVariants,
  Spinner,
  EmptyStateHeader,
} from '@patternfly/react-core'
import { CubesIcon } from '@patternfly/react-icons/dist/esm/icons/cubes-icon.js'
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
        <Spinner aria-label='Loading Camel Contexts tree' />
      </PageSection>
    )
  }

  if (tree.isEmpty()) {
    return (
      <PageSection variant={PageSectionVariants.light}>
        <EmptyState variant={EmptyStateVariant.full}>
          <EmptyStateHeader
            titleText='No Camel Contexts found'
            icon={<EmptyStateIcon icon={CubesIcon} />}
            headingLevel='h1'
          />
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
        <div>
          <CamelContent />
        </div>
      </Split>
    </CamelContext.Provider>
  )
}
