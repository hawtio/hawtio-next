import { hawtio } from '@hawtio/core'
import { Nav, NavItem, NavList, PageSidebar } from '@patternfly/react-core'
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

export const HawtioSidebar: React.FunctionComponent = () => {
  const { pathname } = useLocation()
  const pageNav = (
    <Nav theme="dark">
      <NavList>
        {hawtio.getPlugins()
          .filter(plugin => plugin.isActive?.() !== false)
          .map(plugin => (
            <NavItem key={plugin.id} isActive={plugin.path === pathname}>
              <NavLink to={plugin.path}>{plugin.title}</NavLink>
            </NavItem>
          ))
        }
      </NavList>
    </Nav>
  )
  return <PageSidebar nav={pageNav} theme="dark" />
}
