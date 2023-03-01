import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  Nav,
  NavItem,
  NavList,
  PageGroup,
  PageNavigation,
  PageSection,
  PageSectionVariants,
  Text,
  Title,
} from '@patternfly/react-core'
import './CamelContent.css'
import { CubesIcon } from '@patternfly/react-icons'
import React, { useContext } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { CamelContext } from './context'
import { Attributes, Operations, Chart, JmxContentMBeans, MBeanNode } from '@hawtiosrc/plugins/shared'
import { Contexts } from './contexts'
import * as ccs from './camel-content-service'

export const CamelContent: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const { pathname, search } = useLocation()

  if (!selectedNode) {
    return (
      <PageSection variant={PageSectionVariants.light} isFilled>
        <EmptyState variant={EmptyStateVariant.full}>
          <EmptyStateIcon icon={CubesIcon} />
          <Title headingLevel='h1' size='lg'>
            Select Camel Node
          </Title>
        </EmptyState>
      </PageSection>
    )
  }

  interface NavItem {
    id: string
    title: string
    component: React.FunctionComponent
    isApplicable(node: MBeanNode): boolean
  }

  /**
   * Test if nav should contain general mbean tabs
   */
  const mBeanApplicable = (node: MBeanNode) =>
    ccs.hasMBean(node) && !ccs.isContextsFolder(node) && !ccs.isRoutesFolder(node) && !ccs.isRouteNode(node)

  const allNavItems: NavItem[] = [
    {
      id: 'contexts',
      title: 'Contexts',
      component: Contexts,
      isApplicable: (node: MBeanNode) => ccs.isContextsFolder(node),
    },
    { id: 'attributes', title: 'Attributes', component: Attributes, isApplicable: mBeanApplicable },
    { id: 'operations', title: 'Operations', component: Operations, isApplicable: mBeanApplicable },
    { id: 'chart', title: 'Chart', component: Chart, isApplicable: mBeanApplicable },
  ]

  /* Filter the nav items to those applicable to the selected node */
  const navItems = allNavItems.filter(nav => nav.isApplicable(selectedNode))

  const camelNav = navItems.length > 0 && (
    <Nav aria-label='Camel Nav' variant='tertiary'>
      <NavList>
        {navItems.map(nav => (
          <NavItem key={nav.id} isActive={pathname === nav.id}>
            <NavLink to={{ pathname: nav.id, search }}>{nav.title}</NavLink>
          </NavItem>
        ))}
      </NavList>
    </Nav>
  )

  const camelRoutes = navItems.map(nav => (
    <Route key={nav.id} path={nav.id} element={React.createElement(nav.component)} />
  ))

  return (
    <React.Fragment>
      <PageGroup>
        <PageSection variant={PageSectionVariants.light}>
          <Title headingLevel='h1'>{selectedNode.name}</Title>
          <Text component='small'>{selectedNode.objectName}</Text>
        </PageSection>
        {navItems.length > 0 && <PageNavigation>{camelNav}</PageNavigation>}
      </PageGroup>
      <PageSection className={'camel-main'}>
        {navItems.length > 0 && (
          <React.Fragment>
            <Routes>
              {camelRoutes}
              <Route key='root' path='/' element={<Navigate to={navItems[0].id} />} />
            </Routes>
          </React.Fragment>
        )}
        {navItems.length === 0 && !selectedNode.objectName && <JmxContentMBeans />}
      </PageSection>
    </React.Fragment>
  )
}
