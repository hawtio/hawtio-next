import { Nav, NavItem, NavList, PageSidebar } from '@patternfly/react-core'
import React, { useContext } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { PageContext } from './context'

export const HawtioSidebar: React.FunctionComponent = () => {
  const { plugins } = useContext(PageContext)
  const { pathname } = useLocation()

  const pageNav = (
    <Nav theme='dark'>
      <NavList>
        {plugins.map(plugin => (
          <NavItem key={plugin.id} isActive={plugin.path === pathname}>
            <NavLink to={plugin.path}>{plugin.title}</NavLink>
          </NavItem>
        ))}
      </NavList>
    </Nav>
  )

  return <PageSidebar nav={pageNav} theme='dark' />
}
