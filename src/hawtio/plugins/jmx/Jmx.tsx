import { Button, Card, EmptyState, EmptyStateIcon, EmptyStateVariant, Nav, NavItem, NavList, PageGroup, PageNavigation, PageSection, PageSectionVariants, Spinner, Text, TextVariants, Title, Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem, Tooltip, TreeView, TreeViewDataItem, TreeViewSearch } from '@patternfly/react-core'
import { CubesIcon, MinusIcon, PlusIcon } from '@patternfly/react-icons'
import { Table, TableBody, TableHeader, TableProps } from '@patternfly/react-table'
import React, { ChangeEvent, useContext, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Split from 'react-split'
import { MBeanTreeContext, useMBeanTree } from './context'
import './Jmx.css'

export const Jmx: React.FunctionComponent = () => {
  const { tree, loaded, setTree } = useMBeanTree()

  if (!loaded) {
    return (
      <PageSection>
        <Spinner isSVG aria-label="Loading MBean tree" />
      </PageSection>
    )
  }

  if (tree.isEmpty()) {
    return (
      <PageSection variant={PageSectionVariants.light}>
        <EmptyState variant={EmptyStateVariant.full}>
          <EmptyStateIcon icon={CubesIcon} />
          <Title headingLevel="h1" size="lg">No MBeans found</Title>
        </EmptyState>
      </PageSection>
    )
  }

  return (
    <MBeanTreeContext.Provider value={{ tree, setTree }}>
      <Split
        className="split"
        sizes={[30, 70]}
        minSize={200}
        gutterSize={5}
      >
        <div>
          <JmxTreeView />
        </div>
        <div>
          <JmxContent />
        </div>
      </Split>
    </MBeanTreeContext.Provider>
  )
}

export const JmxTreeView: React.FunctionComponent = () => {
  const { tree } = useContext(MBeanTreeContext)
  const [expanded, setExpanded] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSearch = (event: ChangeEvent<HTMLInputElement>) => {
    // TODO
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSelect = (event: React.MouseEvent<Element, MouseEvent>, item: TreeViewDataItem, parentItem: TreeViewDataItem) => {
    // TODO
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
            <Tooltip content={expanded ? 'Collapse all' : 'Expand all'} removeFindDomNode>
              <Button variant="plain" aria-label="Expand Collapse" onClick={toggleExpanded}>
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

const JmxContent: React.FunctionComponent = () => {
  const { pathname } = useLocation()
  const columns: TableProps['cells'] = ['Attribute', 'Value']
  const rows: TableProps['rows'] = [['Verbose', 'false']]

  const path = (id: string) => `/jmx/${id}`

  const navItems = [
    { id: 'attributes', title: 'Attributes' },
    { id: 'operations', title: 'Operations' },
    { id: 'chart', title: 'Chart' },
  ]

  const MBeanNav = () => (
    <Nav aria-label="MBean Nav" variant="tertiary">
      <NavList>
        {navItems.map(nav =>
          <NavItem key={nav.id} isActive={pathname === path(nav.id)}>
            <NavLink to={path(nav.id)}>{nav.title}</NavLink>
          </NavItem>
        )}
      </NavList>
    </Nav>
  )

  return (
    <React.Fragment>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel="h1">Memory</Title>
        <Text component={TextVariants.small}>
          java.lang:type=Memory
        </Text>
      </PageSection>
      <PageGroup>
        <PageNavigation>
          <MBeanNav />
        </PageNavigation>
      </PageGroup>
      <PageSection>
        <Card isFullHeight>
          <Table
            aria-label="Attributes"
            variant="compact"
            cells={columns}
            rows={rows}
          >
            <TableHeader />
            <TableBody />
          </Table>
        </Card>
      </PageSection>
    </React.Fragment>
  )
}
