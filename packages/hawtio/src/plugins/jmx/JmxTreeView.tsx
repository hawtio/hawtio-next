import { TreeView, TreeViewDataItem } from '@patternfly/react-core'
import React, { ChangeEvent, useContext, useState } from 'react'
import { PluginTreeViewToolbar, MBeanNode } from '@hawtiosrc/plugins/shared'
import { MBeanTreeContext } from './context'
import './JmxTreeView.css'
import { useNavigate } from "react-router-dom"
import { pluginPath } from './globals'

export const JmxTreeView: React.FunctionComponent = () => {
  const { tree, selectedNode, setSelectedNode } = useContext(MBeanTreeContext)
  const [expanded, setExpanded] = useState(false)
  const [filteredTree, setFilteredTree] = useState(tree.getTree())
  const navigate = useNavigate()

  const onSearch = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.value) setFilteredTree(tree.getTree())

    const treeElements = lookupSearchInTree(event.target.value, tree.getTree())

    if (treeElements.length === 0) setFilteredTree(tree.getTree())
    else setFilteredTree(treeElements)
  }

  const onSelect = (event: React.MouseEvent<Element, MouseEvent>, item: TreeViewDataItem) => {
    setSelectedNode(item as MBeanNode)
    /* On change of node selection update the url to the base plugin path */
    navigate(pluginPath)
  }

  const lookupSearchInTree = (search: string, tree?: MBeanNode[]): MBeanNode[] => {
    if (!tree || tree?.length === 0) return []

    let results: MBeanNode[] = []

    for (const parentNode of tree) {
      if (parentNode.name.toLowerCase().includes(search.toLowerCase())) {
        results = results.concat(parentNode)
      } else {
        const resultsInSubtree = lookupSearchInTree(search, parentNode.children)

        if (resultsInSubtree.length !== 0) {
          const parentNodeCloned = Object.assign({}, parentNode)
          parentNodeCloned.children = resultsInSubtree

          results = results.concat(parentNodeCloned)
        }
      }
    }

    return results
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
