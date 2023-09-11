import { PageSection, Spinner } from '@patternfly/react-core'
import React from 'react'
import Split from 'react-split'
import './Quartz.css'
import { QuartzContent } from './QuartzContent'
import { QuartzTreeView } from './QuartzTreeView'
import { QuartzContext, useQuartz } from './context'

export const Quartz: React.FunctionComponent = () => {
  const { tree, loaded, selectedNode, setSelectedNode } = useQuartz()

  if (!loaded) {
    return (
      <PageSection>
        <Spinner isSVG aria-label='Loading Quartz schedulers' />
      </PageSection>
    )
  }

  return (
    <QuartzContext.Provider value={{ tree, selectedNode, setSelectedNode }}>
      <Split className='quartz-split' sizes={[20, 80]} minSize={100} gutterSize={5}>
        <div>
          <QuartzTreeView />
        </div>
        <div>
          <QuartzContent />
        </div>
      </Split>
    </QuartzContext.Provider>
  )
}
