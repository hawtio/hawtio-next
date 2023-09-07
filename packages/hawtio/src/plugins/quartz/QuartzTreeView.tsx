import { TreeView, TreeViewDataItem } from '@patternfly/react-core'
import React, { useContext } from 'react'
import { MBeanNode } from '../shared'
import './QuartzTreeView.css'
import { QuartzContext } from './context'

export const QuartzTreeView: React.FunctionComponent = () => {
  const { tree, selectedNode, setSelectedNode } = useContext(QuartzContext)

  const onSelect = (_event: React.MouseEvent<Element, MouseEvent>, item: TreeViewDataItem) => {
    setSelectedNode(item as MBeanNode)
  }

  return (
    <TreeView
      id='quartz-tree-view'
      data={tree.getTree()}
      hasGuides={true}
      hasSelectableNodes={true}
      activeItems={selectedNode ? [selectedNode] : []}
      onSelect={onSelect}
    />
  )
}
