import { Divider, Nav, NavItem, NavList, PageGroup, PageSection, Title } from '@patternfly/react-core'
import React from 'react'

import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Metrics } from './Metrics'
import { SysProps } from './SysProps'
import { Threads } from './Threads'

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
                <NavItem key={navItem.id} isActive={location.pathname === `/runtime/${navItem.id}`}>
                  <NavLink to={navItem.id}>{navItem.title}</NavLink>
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
        <Routes>
          {navItems.map(navItem => (
            <Route key={navItem.id} path={navItem.id} element={navItem.component} />
          ))}
          <Route path='/' element={<Navigate to='sysprops' />} />
        </Routes>
      </PageSection>
    </React.Fragment>
  )
}
