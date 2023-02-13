import { TreeView, TreeViewDataItem } from '@patternfly/react-core'
import React, { ChangeEvent, useContext, useState } from 'react'
import { PluginTreeViewToolbar } from '@hawtiosrc/plugins/shared'
import { MBeanNode } from '@hawtiosrc/plugins/shared'
import { MBeanTreeContext } from './context'
import './JmxTreeView.css'

export const JmxTreeView: React.FunctionComponent = () => {
  const { tree, setNode } = useContext(MBeanTreeContext)
  const [expanded, setExpanded] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSearch = (event: ChangeEvent<HTMLInputElement>) => {
    // TODO
  }

  const onSelect = (event: React.MouseEvent<Element, MouseEvent>, item: TreeViewDataItem) => {
    setNode(item as MBeanNode)
  }

  return (
    <TreeView
      id='jmx-tree-view'
      data={tree.getTree()}
      hasGuides={true}
      allExpanded={expanded}
      onSelect={onSelect}
      toolbar={<PluginTreeViewToolbar onSearch={onSearch} onSetExpanded={setExpanded} />}
    />
  )
}
