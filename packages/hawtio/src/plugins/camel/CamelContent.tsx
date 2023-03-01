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
import { CubesIcon } from '@patternfly/react-icons'
import React, { useContext } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { CamelContext } from './context'
import { JmxContentMBeans, NodeProps } from '@hawtiosrc/plugins/shared/components'
import { Attributes } from '@hawtiosrc/plugins/shared/components/attributes'
import { Operations } from '@hawtiosrc/plugins/shared/components/operations'
import { Chart } from '@hawtiosrc/plugins/shared/components/chart'
import { MBeanNode } from '@hawtiosrc/plugins/shared/tree'
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
    id: string,
    title: string,
    component: React.FunctionComponent<NodeProps>,
    isApplicable(node: MBeanNode): boolean
  }

  /**
   * Test if nav should contain general mbean tabs
   */
  const mBeanApplicable = (node: MBeanNode) => !ccs.isContextsFolder(node) && !ccs.isRoutesFolder(node) && !ccs.isRouteNode(node)

  const navItems: NavItem[] = [
    { id: 'attributes', title: 'Attributes', component: Attributes, isApplicable: mBeanApplicable },
    { id: 'operations', title: 'Operations', component: Operations, isApplicable: mBeanApplicable },
    { id: 'chart', title: 'Chart', component: Chart, isApplicable: mBeanApplicable }
  ]

  const camelNav = (
    <Nav aria-label='Camel Nav' variant='tertiary'>
      <NavList>
        {navItems.map(nav => (
          nav.isApplicable(selectedNode) &&
            (<NavItem key={nav.id} isActive={pathname === nav.id}>
              <NavLink to={{ pathname: nav.id, search }}>{nav.title}</NavLink>
            </NavItem>)
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
        {selectedNode.objectName && <PageNavigation>{camelNav}</PageNavigation>}
      </PageGroup>
      <PageSection>
        {selectedNode.objectName && (
          <React.Fragment>
            <Routes>
              {camelRoutes}
              <Route key='root' path='/' element={<Navigate to={'attributes'} />} />
            </Routes>
          </React.Fragment>
        )}
        {!selectedNode.objectName && <JmxContentMBeans />}
      </PageSection>
    </React.Fragment>
  )
}
