import { Card, CardBody, EmptyState, EmptyStateIcon, EmptyStateVariant, Nav, NavItem, NavList, PageGroup, PageNavigation, PageSection, PageSectionVariants, Text, TextVariants, Title } from '@patternfly/react-core'
import { CubesIcon, InfoCircleIcon } from '@patternfly/react-icons'
import { OnRowClick, Table, TableBody, TableHeader, TableProps } from '@patternfly/react-table'
import React, { useContext } from 'react'
import { NavLink, Route, useLocation } from 'react-router-dom'
import { Attributes } from './attributes/Attributes'
import { Chart } from './chart/Chart'
import { MBeanTreeContext } from './context'
import { Operations } from './operations/Operations'

export const JmxContent: React.FunctionComponent = () => {
  const { node } = useContext(MBeanTreeContext)
  const { pathname, search } = useLocation()

  if (!node) {
    return (
      <PageSection variant={PageSectionVariants.light} isFilled>
        <EmptyState variant={EmptyStateVariant.full}>
          <EmptyStateIcon icon={CubesIcon} />
          <Title headingLevel="h1" size="lg">Select MBean</Title>
        </EmptyState>
      </PageSection>
    )
  }

  const path = (id: string) => `/jmx/${id}`

  const navItems = [
    { id: 'attributes', title: 'Attributes', component: Attributes },
    { id: 'operations', title: 'Operations', component: Operations },
    { id: 'chart', title: 'Chart', component: Chart },
  ]

  const mbeanNav = (
    <Nav aria-label="MBean Nav" variant="tertiary">
      <NavList>
        {navItems.map(nav =>
          <NavItem key={nav.id} isActive={pathname === path(nav.id)}>
            <NavLink to={{ pathname: path(nav.id), search }}>{nav.title}</NavLink>
          </NavItem>
        )}
      </NavList>
    </Nav>
  )

  const mbeanRoutes = navItems.map(nav =>
    <Route key={nav.id} path={path(nav.id)} component={nav.component} />
  )

  return (
    <React.Fragment>
      <PageGroup>
        <PageSection variant={PageSectionVariants.light}>
          <Title headingLevel="h1">{node.name}</Title>
          <Text component={TextVariants.small}>{node.objectName}</Text>
        </PageSection>
        {node.objectName &&
          <PageNavigation>
            {mbeanNav}
          </PageNavigation>
        }
      </PageGroup>
      <PageSection>
        {node.objectName &&
          <React.Fragment>
            {mbeanRoutes}
            <Route key='root' exact path='/jmx' component={Attributes} />
          </React.Fragment>
        }
        {!node.objectName &&
          <JmxContentMBeans />
        }
      </PageSection>
    </React.Fragment>
  )
}

const JmxContentMBeans: React.FunctionComponent = () => {
  const { node, setNode } = useContext(MBeanTreeContext)

  if (!node) {
    return null
  }

  const columns: TableProps['cells'] = ['MBean', 'Object Name']
  const rows: TableProps['rows'] = (node.children || [])
    .map(child => [child.name, child.objectName || '-'])

  if (rows.length === 0) {
    return (
      <Card>
        <CardBody>
          <Text component="p">
            <InfoCircleIcon /> This node has no MBeans.
          </Text>
        </CardBody>
      </Card>
    )
  }

  const selectChild: OnRowClick = (_event, row) => {
    const clicked = row[0]
    const selected = node.children?.find(child => child.name === clicked)
    if (selected) {
      setNode(selected)
    }
  }

  return (
    <Card isFullHeight>
      <Table
        aria-label="MBeans"
        variant="compact"
        cells={columns}
        rows={rows}
      >
        <TableHeader />
        <TableBody onRowClick={selectChild} />
      </Table>
    </Card>
  )
}
