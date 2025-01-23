import { Button, Masthead, MastheadContent, MastheadMain, Nav, NavItem, NavList, PageSidebar, PageSidebarBody, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core'
import React, { useContext } from 'react'
import { NavLink, useLocation } from '@hawtiosrc/virtual-router'
import { PageContext } from './context'
import { PluginBarOrientation } from '@hawtiosrc/core'

type HawtioSidebarProps = {
  orientation?: PluginBarOrientation
}

export const HawtioSidebar: React.FunctionComponent<HawtioSidebarProps> = (props: HawtioSidebarProps) => {
  const { plugins } = useContext(PageContext)
  const { pathname } = useLocation()

  const pathMatch = (path: string, pluginPath: string) => {
    if (!pluginPath.startsWith('/')) {
      pluginPath = '/' + pluginPath
    }
    return path.startsWith(pluginPath)
  }

  const filteredPlugins = plugins
    .filter(plugin => plugin.path != null)

  if (props.orientation === PluginBarOrientation.HORIZONTAL) {
    const headerToolbar = (
      <Toolbar id="hawtio-plugin-toolbar">
        <ToolbarContent>
          {filteredPlugins.map(plugin => (
            <ToolbarItem key={plugin.id}>
              <Button variant="secondary" isActive={pathMatch(pathname, plugin.path!)}>
                <NavLink to={plugin.path!}>{plugin.title}</NavLink>
              </Button>
            </ToolbarItem>
          ))}
        </ToolbarContent>
      </Toolbar>
    )

    return (
      <Masthead inset={{ default: 'insetXs' }}>
        <MastheadContent>{headerToolbar}</MastheadContent>
      </Masthead>
    )
  }

  const pageNav = (
    <Nav theme='dark'>
      <NavList>
        {filteredPlugins.map(plugin => (
          <NavItem key={plugin.id} isActive={pathMatch(pathname, plugin.path!)}>
            <NavLink to={plugin.path!}>{plugin.title}</NavLink>
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
