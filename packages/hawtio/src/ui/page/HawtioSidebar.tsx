import { Nav, NavItem, NavList, PageSidebar } from '@patternfly/react-core'
import React, { useContext } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { PageContext } from './context'

export const HawtioSidebar: React.FunctionComponent = () => {
  const { plugins } = useContext(PageContext)
  const { pathname } = useLocation()

  const pathMatch = (path: string, pluginPath: string) => {
    if (!pluginPath.startsWith('/')) {
      pluginPath = '/' + pluginPath
    }
    return path.startsWith(pluginPath)
  }

  const pageNav = (
    <Nav theme='dark'>
      <NavList>
        {plugins
          .filter(plugin => plugin.path != null)
          .map(plugin => (
            <NavItem key={plugin.id} isActive={pathMatch(pathname, plugin.path!)}>
              <NavLink to={plugin.path!}>{plugin.title}</NavLink>
            </NavItem>
          ))}
      </NavList>
    </Nav>
  )

  return <PageSidebar nav={pageNav} theme='dark' />
}
