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
  EmptyStateHeader,
  EmptyStateFooter,
} from '@patternfly/react-core'
import { CubesIcon } from '@patternfly/react-icons'
import React, { useContext } from 'react'
import { NavLink, Redirect, Route, Switch, useLocation } from 'react-router-dom' // includes NavLink
import './QuartzContent.css'
import { QuartzContext } from './context'
import { pluginPath } from './globals'
import { Jobs } from './jobs'
import { Scheduler } from './scheduler/Scheduler'
import { Triggers } from './triggers'
import { hawtio } from '@hawtiosrc/core'

export const QuartzContent: React.FunctionComponent = () => {
  const { tree, selectedNode } = useContext(QuartzContext)
  const { pathname, search } = useLocation()

  if (tree.isEmpty()) {
    return (
      <PageSection variant='light'>
        <EmptyState variant='full'>
          <EmptyStateHeader
            titleText='No Quartz schedulers found'
            icon={<EmptyStateIcon icon={CubesIcon} />}
            headingLevel='h1'
          />
        </EmptyState>
      </PageSection>
    )
  }

  if (!selectedNode) {
    return (
      <PageSection variant='light'>
        <EmptyState variant='full'>
          <EmptyStateHeader
            titleText='No scheduler selected'
            icon={<EmptyStateIcon icon={CubesIcon} />}
            headingLevel='h1'
          />
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
    <Nav aria-label='Quartz Nav' variant='tertiary'>
      <NavList>
        {navItems.map(nav => (
          <NavItem key={nav.id} isActive={hawtio.fullPath(pathname) === hawtio.fullPath(pluginPath, nav.id)}>
            <NavLink to={{ pathname: hawtio.fullPath(pluginPath, nav.id), search }}>{nav.title}</NavLink>
          </NavItem>
        ))}
      </NavList>
    </Nav>
  )

  const routes = navItems.map(nav => <Route key={nav.id} path={hawtio.fullPath(pluginPath, nav.id)}>{React.createElement(nav.component)}</Route>)

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
        <Switch>
          {routes}
          <Route key='root' exact path={hawtio.fullPath(pluginPath)}><Redirect to={hawtio.fullPath(pluginPath, navItems[0]?.id ?? '')} /></Route>
        </Switch>
      </PageSection>
    </PageGroup>
  )
}
