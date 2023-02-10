import { MBeanNode, MBeanTree, PluginTreeViewToolbar } from '@hawtio/plugins/shared'
import { TreeView, TreeViewDataItem } from '@patternfly/react-core'
import React, { ChangeEvent, useContext, useState } from 'react'
import './CamelTreeView.css'
import { CamelContext } from './context'

/**
 * Expansion requires more than 2 states since the expandAll
 * must be removed completely to defer to the expanded state
 * of each data node
 */
enum ExpansionValue {
  /**
   * should revert to the expanded state of the data
   */
  Default,
  /**
   * all data should be expanded
   */
  ExpandAll,
  /**
   * all data should be collapsed
   */
  CollapseAll,
}

export const CamelTreeView: React.FunctionComponent = () => {
  const { tree, node, setNode } = useContext(CamelContext)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [expanded, setExpanded] = useState(ExpansionValue.Default)
  const [filteredTree, setFilteredTree] = useState(tree.getTree())

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSearch = (event: ChangeEvent<HTMLInputElement>) => {
    // Ensure no node from the 'old' filtered is lingering
    setNode(null)
    setExpanded(ExpansionValue.Default)

    const input = event.target.value
    if (input === '') {
      setFilteredTree(tree.getTree())
    } else {
      setFilteredTree(
        MBeanTree.createFilteredTree(tree.getTree(), (node: MBeanNode) =>
          node.name.toLowerCase().includes(input.toLowerCase()),
        ),
      )
      setExpanded(ExpansionValue.ExpandAll)
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

  const setAllExpanded = (value: boolean) => {
    setExpanded(value ? ExpansionValue.ExpandAll : ExpansionValue.CollapseAll)
  }

  const expandedProp = (): object => {
    switch (expanded) {
      case ExpansionValue.ExpandAll:
        return { allExpanded: true }
      case ExpansionValue.CollapseAll:
        return { allExpanded: false }
      default:
        return {}
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
      {...expandedProp()}
      toolbar={<PluginTreeViewToolbar onSearch={onSearch} onSetExpanded={setAllExpanded} />}
    />
  )
}
