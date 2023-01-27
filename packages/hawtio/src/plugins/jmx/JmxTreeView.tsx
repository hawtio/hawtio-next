import { Button, Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem, Tooltip, TreeView, TreeViewDataItem, TreeViewSearch } from '@patternfly/react-core'
import { MinusIcon, PlusIcon } from '@patternfly/react-icons'
import React, { ChangeEvent, useContext, useState } from 'react'
import { MBeanTreeContext } from './context'
import './JmxTreeView.css'
import { MBeanNode } from './tree'

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

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  const TreeToolbar = () => (
    <Toolbar style={{ padding: 0 }}>
      <ToolbarContent style={{ padding: 0 }}>
        <ToolbarGroup variant="filter-group">
          <ToolbarItem variant="search-filter" widths={{ default: '100%' }}>
            <TreeViewSearch
              onSearch={onSearch}
              id="input-search"
              name="search-input"
              aria-label="Search input example"
            />
          </ToolbarItem>
          <ToolbarItem variant="expand-all">
            <Tooltip
              content={expanded ? 'Collapse all' : 'Expand all'}
              removeFindDomNode
            >
              <Button
                variant="plain"
                aria-label="Expand Collapse"
                onClick={toggleExpanded}
              >
                {expanded ? <MinusIcon /> : <PlusIcon />}
              </Button>
            </Tooltip>
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  )

  return (
    <TreeView
      id="jmx-tree-view"
      data={tree.getTree()}
      hasGuides={true}
      allExpanded={expanded}
      onSelect={onSelect}
      toolbar={<TreeToolbar />}
    />
  )
}
