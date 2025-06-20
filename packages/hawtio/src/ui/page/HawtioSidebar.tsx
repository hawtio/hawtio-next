import { Nav, NavItem, NavList, PageSidebar, PageSidebarBody } from '@patternfly/react-core'
import React, { useContext } from 'react'
import { NavLink, useLocation } from 'react-router-dom' // includes NavLink
import { PageContext } from './context'
import { hawtio } from '@hawtiosrc/core'

export const HawtioSidebar: React.FunctionComponent = () => {
  const { plugins } = useContext(PageContext)
  const { pathname } = useLocation()

  const pathMatch = (path: string, pluginPath: string) => {
    pluginPath = hawtio.fullPath(pluginPath)

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
              <NavLink to={hawtio.fullPath(plugin.path!)}>{plugin.title}</NavLink>
            </NavItem>
          ))}
      </NavList>
    </Nav>
  )

  return (
    <PageSidebar theme='dark'>
      <PageSidebarBody>{pageNav}</PageSidebarBody>
    </PageSidebar>
  )
}
