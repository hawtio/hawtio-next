import { hawtio } from '@hawtio/core'
import { Nav, NavItem, NavList, PageSidebar } from '@patternfly/react-core'
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

export const HawtioSidebar: React.FunctionComponent = () => {
  const location = useLocation()
  const PageNav = (
    <Nav theme="dark">
      <NavList>
        {hawtio.getPlugins().map(plugin => (
          <NavItem key={plugin.id} isActive={plugin.path === location.pathname}>
            <NavLink to={plugin.path}>{plugin.title}</NavLink>
          </NavItem>
        ))}
      </NavList>
    </Nav>
  )
  return <PageSidebar nav={PageNav} theme="dark" />
}
