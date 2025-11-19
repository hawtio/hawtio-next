import { Divider, Nav, NavItem, NavList, PageGroup, PageSection, Title } from '@patternfly/react-core'
import React from 'react'
import { FlightRecorder } from './FlightRecorder'

import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'

type NavItem = {
  id: string
  title: string
  component: JSX.Element
}
export const Diagnostics: React.FunctionComponent = () => {
  const location = useLocation()

  const navItems: NavItem[] = [{ id: 'jfr', title: 'Flight Recorder', component: <FlightRecorder /> }]

  return (
    <React.Fragment>
      <PageSection hasBodyWrapper={false}>
        <Title headingLevel='h1'>Diagnostics</Title>
      </PageSection>
      <PageGroup>
        <Divider />
        <PageSection hasBodyWrapper={false} type='tabs' hasShadowBottom>
          <Nav aria-label='Diagnostics Nav' variant='horizontal-subnav'>
            <NavList>
              {navItems.map(navItem => (
                <NavItem key={navItem.id} isActive={location.pathname === `/diagnostics/${navItem.id}`}>
                  <NavLink to={navItem.id}>{navItem.title}</NavLink>
                </NavItem>
              ))}
            </NavList>
          </Nav>
        </PageSection>
      </PageGroup>
      <Divider />
      <PageSection hasBodyWrapper={false}>
        <Routes>
          {navItems.map(navItem => (
            <Route key={navItem.id} path={navItem.id} element={navItem.component} />
          ))}
          <Route path='/' element={<Navigate to='jfr' />} />
        </Routes>
      </PageSection>
    </React.Fragment>
  )
}
