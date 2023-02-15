import { MBeanNode, MBeanTree, PluginTreeViewToolbar } from '@hawtio/plugins/shared'
import { TreeView, TreeViewDataItem } from '@patternfly/react-core'
import React, { ChangeEvent, useContext, useState } from 'react'
import './CamelTreeView.css'
import { CamelContext } from './context'

export const CamelTreeView: React.FunctionComponent = () => {
  const { tree, node, setNode } = useContext(CamelContext)
  //
  // TODO consider whether expanded is required here
  //
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [expanded, setExpanded] = useState(false)
  const [filteredTree, setFilteredTree] = useState(tree.getTree())

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSearch = (event: ChangeEvent<HTMLInputElement>) => {
    // Ensure no node from the 'old' filtered is lingering
    setNode(null)

    const input = event.target.value
    if (input === '') {
      setFilteredTree(tree.getTree())
    } else {
      setFilteredTree(
        MBeanTree.createFilteredTree(tree.getTree(), (node: MBeanNode) =>
          node.name.toLowerCase().includes(input.toLowerCase()),
        ),
      )
    }
  }

  const onSelect = (event: React.MouseEvent<Element, MouseEvent>, item: TreeViewDataItem) => {
    //TODO
    console.log('Select TODO')
    setNode(item as MBeanNode)
  }

  const getActiveItems = (): TreeViewDataItem[] => {
    if (!node) {
      console.log('Getting Active Items: NONE')
      return []
    } else {
      console.log('Getting Active Items: ' + node.id)
      return [node as TreeViewDataItem]
    }
  }

  return (
    <TreeView
      id='camel-tree-view'
      data={filteredTree}
      hasGuides={true}
      onSelect={onSelect}
      hasSelectableNodes={true}
      activeItems={getActiveItems()}
      toolbar={<PluginTreeViewToolbar onSearch={onSearch} onSetExpanded={setExpanded} />}
    />
  )
}
