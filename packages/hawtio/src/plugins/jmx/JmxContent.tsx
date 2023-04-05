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
import './JmxContent.css'
import { CubesIcon } from '@patternfly/react-icons'
import React, { useContext } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { MBeanTreeContext } from './context'
import { Chart } from '@hawtiosrc/plugins/shared/chart'
import { Operations } from '@hawtiosrc/plugins/shared/operations'
import { Attributes } from '@hawtiosrc/plugins/shared/attributes'
import { JmxContentMBeans, MBeanNode } from '@hawtiosrc/plugins/shared'
import { AttributeTable } from '../shared/attributes/AttributeTable'

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

  const mBeanApplicable = (node: MBeanNode) => Boolean(node.objectName)
  const mBeanCollectionApplicable = (node: MBeanNode) => Boolean(node.children?.every(child => child.objectName))
  const DEFAULT = (node: MBeanNode) => true

  const tableSelector: (node: MBeanNode) => React.FunctionComponent = (node: MBeanNode) => {
    const tablePriorityList: { condition: (node: MBeanNode) => boolean; element: React.FunctionComponent }[] = [
      { condition: mBeanApplicable, element: Attributes },
      { condition: mBeanCollectionApplicable, element: AttributeTable },
      { condition: DEFAULT, element: JmxContentMBeans },
    ]

    //Find first
    return tablePriorityList.filter(entry => entry.condition(node))[0].element
  }

  const allNavItems = [
    { id: 'attributes', title: 'Attributes', component: tableSelector(selectedNode), isApplicable: DEFAULT },
    { id: 'operations', title: 'Operations', component: Operations, isApplicable: mBeanApplicable },
    { id: 'chart', title: 'Chart', component: Chart, isApplicable: mBeanApplicable },
  ]

  /* Filter the nav items to those applicable to the selected node */
  const navItems = allNavItems.filter(nav => nav.isApplicable(selectedNode))

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
        <PageNavigation>{mbeanNav}</PageNavigation>
      </PageGroup>
      <PageSection className={'jmx-main'}>
        <React.Fragment>
          <Routes>
            {mbeanRoutes}
            <Route key='root' path='/' element={<Navigate to={navItems[0].id} />} />
          </Routes>
        </React.Fragment>
      </PageSection>
    </React.Fragment>
  )
}
