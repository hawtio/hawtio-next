import { Nav, NavItem, NavList, PageGroup, PageNavigation, PageSection, Title } from '@patternfly/react-core'
import React from 'react'

import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import {Health} from "@hawtiosrc/plugins/springboot/Health"
import {Info} from "@hawtiosrc/plugins/springboot/Info"
import {Loggers} from "@hawtiosrc/plugins/springboot/Loggers"
import {Trace} from "@hawtiosrc/plugins/springboot/Trace"


type NavItem = {
  id: string
  title: string
  component: JSX.Element
}
export const Springboot: React.FunctionComponent = () => {
  const location = useLocation()

  const navItems: NavItem[] = [
    { id: 'health', title: 'Health', component: <Health /> },
    { id: 'info', title: 'Info', component: <Info /> },
    { id: 'loggers', title: 'Loggers', component: <Loggers /> },
    { id: 'trace', title: 'Trace', component: <Trace /> },
  ]

  return (
    <React.Fragment>
      <PageSection variant='light'>
        <Title headingLevel='h1'>Springboot</Title>
      </PageSection>
      <PageGroup>
        <PageNavigation>
          <Nav aria-label='Spring-boot Nav' variant='tertiary'>
            <NavList>
              {navItems.map(navItem => (
                <NavItem key={navItem.id} isActive={location.pathname === `/springboot/${navItem.id}`}>
                  <NavLink to={navItem.id}>{navItem.title}</NavLink>
                </NavItem>
              ))}
            </NavList>
          </Nav>
        </PageNavigation>
      </PageGroup>
      <PageSection>
        <Routes>
          {navItems.map(navItem => (
            <Route key={navItem.id} path={navItem.id} element={navItem.component} />
          ))}
          <Route path='/' element={<Navigate to='health' />} />
        </Routes>
      </PageSection>
    </React.Fragment>
  )
}
