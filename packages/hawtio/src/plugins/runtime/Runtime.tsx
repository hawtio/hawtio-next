import {
  PageSection,
  PageSectionVariants,
  NavItem,
  Title,
  PageGroup,
  PageNavigation,
  Nav,
  NavList,
  Card,
} from '@patternfly/react-core'
import React from 'react'

import { SysProps } from '@hawtiosrc/plugins/runtime/SysProps'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Metrics } from './Metrics'
import { Threads } from './Threads'

type NavItem = {
  id: string
  title: string
  component: JSX.Element
}
export const Runtime: React.FunctionComponent = () => {
  const location = useLocation()

  const navItems: NavItem[] = [
    { id: 'sysprops', title: 'System Properties', component: <SysProps /> },
    { id: 'metrics', title: 'Metrics', component: <Metrics /> },
    { id: 'threads', title: 'Threads', component: <Threads /> },
  ]

  return (
    <React.Fragment>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel='h1'>Runtime</Title>
      </PageSection>
      <PageGroup>
        <PageNavigation>
          <Nav aria-label='Nav' variant='tertiary'>
            <NavList>
              {navItems.map(navItem => (
                <NavItem key={navItem.id} isActive={location.pathname === `/help/${navItem.id}`}>
                  <NavLink to={navItem.id}>{navItem.title}</NavLink>
                </NavItem>
              ))}
            </NavList>
          </Nav>
        </PageNavigation>
      </PageGroup>
      <PageSection>
        <Card isFullHeight>
          <Routes>
            {navItems.map(navItem => (
              <Route key={navItem.id} path={navItem.id} element={navItem.component} />
            ))}
            <Route path='/' element={<Navigate to='home' />} />
          </Routes>
        </Card>
      </PageSection>
    </React.Fragment>
  )
}
