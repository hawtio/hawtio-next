import React, { ChangeEvent, useState } from 'react'
import { Button, Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem, TreeViewSearch } from '@patternfly/react-core'

interface ToolbarProps {
  onSearch: (event: ChangeEvent<HTMLInputElement>) => void
  onSetExpanded: (newExpanded: boolean) => void
}

export const PluginTreeViewToolbar: React.FunctionComponent<ToolbarProps> = (props: ToolbarProps) => {
  const [expanded, setExpanded] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSearch = (event: ChangeEvent<HTMLInputElement>) => {
    if (props.onSearch) {
      props.onSearch(event)
    }
  }

  const toggleExpanded = () => {
    const newExpanded = !expanded
    setExpanded(newExpanded)
    if (props.onSetExpanded) {
      props.onSetExpanded(newExpanded)
    }
  }

  return (
    <Toolbar style={{ padding: 0 }}>
      <ToolbarContent style={{ padding: 0 }}>
        <ToolbarGroup variant='filter-group'>
          <ToolbarItem variant='search-filter' widths={{ default: '100%' }}>
            <TreeViewSearch
              onSearch={onSearch}
              id='input-search'
              name='search-input'
              aria-label='Search input example'
            />
          </ToolbarItem>
          <ToolbarItem variant='expand-all'>
            <Button variant='link' aria-label='Expand Collapse' onClick={toggleExpanded}>
              {expanded ? 'Collapse all' : 'Expand all'}
            </Button>
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  )
}
