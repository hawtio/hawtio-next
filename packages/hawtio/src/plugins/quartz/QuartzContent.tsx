import { Attributes, Operations } from '@hawtiosrc/plugins/shared'
import {
  Divider,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Nav,
  NavItem,
  NavList,
  PageGroup,
  PageSection,
  PageSectionVariants,
  Text,
  Title,
} from '@patternfly/react-core'
import { CubesIcon } from '@patternfly/react-icons'
import React, { useContext } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './QuartzContent.css'
import { QuartzContext } from './context'
import { pluginPath } from './globals'
import { Jobs } from './jobs'
import { Scheduler } from './scheduler/Scheduler'
import { Triggers } from './triggers'

export const QuartzContent: React.FunctionComponent = () => {
  const { tree, selectedNode } = useContext(QuartzContext)
  const { pathname, search } = useLocation()

  if (tree.isEmpty()) {
    return (
      <PageSection variant='light'>
        <EmptyState variant='full'>
          <EmptyStateIcon icon={CubesIcon} />
          <Title headingLevel='h1' size='lg'>
            No Quartz schedulers found
          </Title>
        </EmptyState>
      </PageSection>
    )
  }

  if (!selectedNode) {
    return (
      <PageSection variant='light'>
        <EmptyState variant='full'>
          <EmptyStateIcon icon={CubesIcon} />
          <Title headingLevel='h1' size='lg'>
            No scheduler selected
          </Title>
          <EmptyStateBody>
            The Quartz plugin allows you to see details about running Quartz Schedulers, and their associated triggers
            and jobs.
          </EmptyStateBody>
          <EmptyStateBody>Select a Quartz Scheduler in the tree to continue.</EmptyStateBody>
        </EmptyState>
      </PageSection>
    )
  }

  const navItems = [
    { id: 'scheduler', title: 'Scheduler', component: Scheduler },
    { id: 'triggers', title: 'Triggers', component: Triggers },
    { id: 'jobs', title: 'Jobs', component: Jobs },
    { id: 'attributes', title: 'Attributes', component: Attributes },
    { id: 'operations', title: 'Operations', component: Operations },
  ]

  const nav = (
    <Nav aria-label='Quartz Nav' variant='tertiary'>
      <NavList>
        {navItems.map(nav => (
          <NavItem key={nav.id} isActive={pathname === `${pluginPath}/${nav.id}`}>
            <NavLink to={{ pathname: nav.id, search }}>{nav.title}</NavLink>
          </NavItem>
        ))}
      </NavList>
    </Nav>
  )

  const routes = navItems.map(nav => <Route key={nav.id} path={nav.id} element={React.createElement(nav.component)} />)

  return (
    <PageGroup id='quartz-content'>
      <PageSection id='quartz-content-header' variant={PageSectionVariants.light}>
        <Title headingLevel='h1'>{selectedNode.name}</Title>
        <Text component='small'>{selectedNode.objectName}</Text>
      </PageSection>
      <Divider />
      <PageSection type='tabs' hasShadowBottom>
        {nav}
      </PageSection>
      <Divider />

      <PageSection
        variant='light'
        id='quartz-content-main'
        padding={{ default: 'noPadding' }}
        hasOverflowScroll
        aria-label='quartz-content-main'
      >
        <Routes>
          {routes}
          <Route key='root' path='/' element={<Navigate to={navItems[0]?.id ?? ''} />} />
        </Routes>
      </PageSection>
    </PageGroup>
  )
}
