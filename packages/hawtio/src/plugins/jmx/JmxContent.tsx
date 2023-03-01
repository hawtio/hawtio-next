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
import { MBeanTreeContext } from './context'
import { Chart } from '@hawtiosrc/plugins/shared/components/chart'
import { Operations } from '@hawtiosrc/plugins/shared/components/operations'
import { Attributes } from '@hawtiosrc/plugins/shared/components/attributes'
import { JmxContentMBeans } from '@hawtiosrc/plugins/shared/components'

export const JmxContent: React.FunctionComponent = () => {
  const { selectedNode } = useContext(MBeanTreeContext)
  const { pathname, search } = useLocation()

  if (!selectedNode) {
    return (
      <PageSection variant={PageSectionVariants.light} isFilled>
        <EmptyState variant={EmptyStateVariant.full}>
          <EmptyStateIcon icon={CubesIcon} />
          <Title headingLevel='h1' size='lg'>
            Select MBean
          </Title>
        </EmptyState>
      </PageSection>
    )
  }

  const navItems = [
    { id: 'attributes', title: 'Attributes', component: Attributes },
    { id: 'operations', title: 'Operations', component: Operations },
    { id: 'chart', title: 'Chart', component: Chart },
  ]

  const mbeanNav = (
    <Nav aria-label='MBean Nav' variant='tertiary'>
      <NavList>
        {navItems.map(nav => (
          <NavItem key={nav.id} isActive={pathname === nav.id}>
            <NavLink to={{ pathname: nav.id, search }}>{nav.title}</NavLink>
          </NavItem>
        ))}
      </NavList>
    </Nav>
  )

  const mbeanRoutes = navItems.map(nav => (
    <Route key={nav.id} path={nav.id} element={React.createElement(nav.component)} />
  ))

  return (
    <React.Fragment>
      <PageGroup>
        <PageSection variant={PageSectionVariants.light}>
          <Title headingLevel='h1'>{selectedNode.name}</Title>
          <Text component='small'>{selectedNode.objectName}</Text>
        </PageSection>
        {selectedNode.objectName && <PageNavigation>{mbeanNav}</PageNavigation>}
      </PageGroup>
      <PageSection>
        {selectedNode.objectName && (
          <React.Fragment>
            <Routes>
              {mbeanRoutes}
              <Route key='root' path='/' element={<Navigate to={'attributes'} />} />
            </Routes>
          </React.Fragment>
        )}
        {!selectedNode.objectName && <JmxContentMBeans />}
      </PageSection>
    </React.Fragment>
  )
}
