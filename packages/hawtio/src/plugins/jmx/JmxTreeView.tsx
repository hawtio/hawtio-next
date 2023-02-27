import { TreeView, TreeViewDataItem } from '@patternfly/react-core'
import React, { ChangeEvent, useContext, useState } from 'react'
import { PluginTreeViewToolbar } from '@hawtio/plugins/shared'
import { MBeanNode } from '@hawtio/plugins/shared'
import { MBeanTreeContext } from './context'
import './JmxTreeView.css'

export const JmxTreeView: React.FunctionComponent = () => {
  const { tree, node, setNode } = useContext(MBeanTreeContext);
  const [expanded, setExpanded] = useState(false);
  const [filteredTree, updateTree] = useState(tree.getTree());

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSearch = (event: ChangeEvent<HTMLInputElement>) => {
    if(!event.target.value) updateTree(tree.getTree());
    
    const treeElements = lookupSearchInTree(event.target.value, tree.getTree());

    if (treeElements.length == 0) updateTree(tree.getTree())
    else updateTree(treeElements);
  }

  const onSelect = (event: React.MouseEvent<Element, MouseEvent>, item: TreeViewDataItem) => {
    setNode(item as MBeanNode)
  }

  const lookupSearchInTree = (search: string, tree?: MBeanNode[]) : MBeanNode[] => {
    if (tree?.length == 0) return [];
    
    let results : MBeanNode[] = [];

    for (let parentNode of tree || []) {
      if(parentNode.name.toLowerCase().includes(search.toLowerCase())) {
        results = results.concat(parentNode);
      } else {
        const resultsInSubtree = lookupSearchInTree(search, parentNode.children);

        if (resultsInSubtree.length != 0) {
          const parentNodeCloned = Object.assign({}, parentNode); 
          parentNodeCloned.children = resultsInSubtree;

          results = results.concat(parentNodeCloned);
        }
      }
    }

    return results;
  }

  return (
    <TreeView
      id='jmx-tree-view'
      data={filteredTree}
      hasGuides={true}
      hasSelectableNodes={true}
      activeItems={node ? [node] : [] }
      allExpanded={expanded}
      onSelect={onSelect}
      toolbar={<PluginTreeViewToolbar onSearch={onSearch} onSetExpanded={setExpanded} />}
    />
  )
}
