import { TreeView, TreeViewDataItem } from '@patternfly/react-core'
import React, { ChangeEvent, useContext, useState } from 'react'
import { PluginTreeViewToolbar, MBeanNode, MBeanTree } from '@hawtiosrc/plugins/shared'
import { MBeanTreeContext } from './context'
import './JmxTreeView.css'
import { useNavigate } from 'react-router-dom'
import { pluginPath } from './globals'

export const JmxTreeView: React.FunctionComponent = () => {
  const { tree, selectedNode, setSelectedNode } = useContext(MBeanTreeContext)
  const [expanded, setExpanded] = useState(false)
  const [filteredTree, setFilteredTree] = useState(tree.getTree())
  const navigate = useNavigate()

  const onSearch = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value

    if (!input) setFilteredTree(tree.getTree())

    const treeElements = MBeanTree.filter(tree.getTree(), node => node.name.toLowerCase().includes(input.toLowerCase()))

    if (treeElements.length === 0) setFilteredTree(tree.getTree())
    else setFilteredTree(treeElements)
  }

  const onSelect = (event: React.MouseEvent<Element, MouseEvent>, item: TreeViewDataItem) => {
    setSelectedNode(item as MBeanNode)
    /* On change of node selection update the url to the base plugin path */
    navigate(pluginPath)
  }

  return (
    <TreeView
      id='jmx-tree-view'
      data={filteredTree}
      hasGuides={true}
      hasSelectableNodes={true}
      activeItems={selectedNode ? [selectedNode] : []}
      allExpanded={expanded}
      onSelect={onSelect}
      toolbar={<PluginTreeViewToolbar onSearch={onSearch} onSetExpanded={setExpanded} />}
    />
  )
}
