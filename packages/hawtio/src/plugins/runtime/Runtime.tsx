import { Divider, Nav, NavItem, NavList, PageGroup, PageSection, Title } from '@patternfly/react-core'
import React from 'react'

import { NavLink, Redirect, Route, Switch, useLocation } from 'react-router-dom' // includes NavLink
import { Metrics } from './Metrics'
import { SysProps } from './SysProps'
import { Threads } from './Threads'
import { pluginPath } from './globals'
import { hawtio } from '@hawtiosrc/core'

type NavItem = {
  id: string
  title: string
  component: JSX.Element
}
export const Runtime: React.FunctionComponent = () => {
  const location = useLocation()

  const navItems: NavItem[] = [
    { id: 'sysprops', title: 'System properties', component: <SysProps /> },
    { id: 'metrics', title: 'Metrics', component: <Metrics /> },
    { id: 'threads', title: 'Threads', component: <Threads /> },
  ]

  return (
    <React.Fragment>
      <PageSection variant='light'>
        <Title headingLevel='h1'>Runtime</Title>
      </PageSection>
      <PageGroup>
        <Divider />
        <PageSection type='tabs' hasShadowBottom>
          <Nav aria-label='Runtime Nav' variant='tertiary'>
            <NavList>
              {navItems.map(navItem => (
                <NavItem
                  key={navItem.id}
                  isActive={hawtio.fullPath(location.pathname) === hawtio.fullPath(pluginPath, navItem.id)}
                >
                  <NavLink to={hawtio.fullPath(pluginPath, navItem.id)}>{navItem.title}</NavLink>
                </NavItem>
              ))}
            </NavList>
          </Nav>
        </PageSection>
      </PageGroup>
      <Divider />
      <PageSection
        variant={location.pathname.includes('metrics') ? 'default' : 'light'}
        padding={{ default: location.pathname.includes('metrics') ? 'padding' : 'noPadding' }}
      >
        <Switch>
          {navItems.map(navItem => (
            <Route key={navItem.id} path={hawtio.fullPath(pluginPath, navItem.id)}>
              {navItem.component}
            </Route>
          ))}
          <Route path={hawtio.fullPath(pluginPath)}>
            <Redirect to={hawtio.fullPath(pluginPath, navItems[0]?.id ?? '')} />
          </Route>
        </Switch>
      </PageSection>
    </React.Fragment>
  )
}
