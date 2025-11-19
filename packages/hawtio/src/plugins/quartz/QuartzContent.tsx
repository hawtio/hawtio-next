import { Attributes, Operations } from '@hawtiosrc/plugins/shared'
import {
  Divider,
  EmptyState,
  EmptyStateBody,
  Nav,
  NavItem,
  NavList,
  PageGroup,
  PageSection,
  Content,
  Title,
  EmptyStateFooter,
} from '@patternfly/react-core'
import { CubesIcon } from '@patternfly/react-icons/dist/esm/icons/cubes-icon'
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
      <PageSection hasBodyWrapper={false}>
        <EmptyState
          headingLevel='h1'
          icon={CubesIcon}
          titleText='No Quartz schedulers found'
          variant='full'
        ></EmptyState>
      </PageSection>
    )
  }

  if (!selectedNode) {
    return (
      <PageSection hasBodyWrapper={false}>
        <EmptyState headingLevel='h1' icon={CubesIcon} titleText='No scheduler selected' variant='full'>
          <EmptyStateBody>
            The Quartz plugin allows you to see details about running Quartz Schedulers, and their associated triggers
            and jobs.
          </EmptyStateBody>
          <EmptyStateFooter>
            <EmptyStateBody>Select a Quartz Scheduler in the tree to continue.</EmptyStateBody>
          </EmptyStateFooter>
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
    <Nav aria-label='Quartz Nav' variant='horizontal-subnav'>
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
      <PageSection hasBodyWrapper={false} id='quartz-content-header'>
        <Title headingLevel='h1'>{selectedNode.name}</Title>
        <Content component='small'>{selectedNode.objectName}</Content>
      </PageSection>
      <Divider />
      <PageSection hasBodyWrapper={false} type='tabs' hasShadowBottom>
        {nav}
      </PageSection>
      <Divider />

      <PageSection
        hasBodyWrapper={false}
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
