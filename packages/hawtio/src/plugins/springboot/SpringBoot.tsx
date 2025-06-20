import { Divider, Nav, NavItem, NavList, PageSection, PageSectionVariants, Title } from '@patternfly/react-core'
import React, { useEffect, useState } from 'react'

import { NavLink, Redirect, Route, Switch, useLocation } from 'react-router-dom' // includes NavLink
import { Health } from './Health'
import { Info } from './Info'
import { Loggers } from './Loggers'
import { TraceView } from './TraceView'
import { springbootService } from './springboot-service'
import { hawtio } from '@hawtiosrc/core'
import { pluginPath } from './globals'

type NavItem = {
  id: string
  title: string
  component: JSX.Element
}
export const SpringBoot: React.FunctionComponent = () => {
  const location = useLocation()
  const [navItems, setNavItems] = useState<NavItem[]>([])

  useEffect(() => {
    const initNavItems = async () => {
      const nav: NavItem[] = []
      if (await springbootService.hasEndpoint('Health')) {
        nav.push({ id: 'health', title: 'Health', component: <Health /> })
      }

      if (await springbootService.hasEndpoint('Info')) {
        nav.push({ id: 'info', title: 'Info', component: <Info /> })
      }

      if (await springbootService.hasEndpoint('Loggers')) {
        nav.push({ id: 'loggers', title: 'Loggers', component: <Loggers /> })
      }

      if (await springbootService.hasEndpoint('Httptrace')) {
        springbootService.setIsSpringBoot3(false)
        nav.push({ id: 'trace', title: 'Trace', component: <TraceView /> })
      }

      if (await springbootService.hasEndpoint('Httpexchanges')) {
        springbootService.setIsSpringBoot3(true)
        nav.push({ id: 'trace', title: 'Trace', component: <TraceView /> })
      }

      setNavItems([...nav])
    }
    initNavItems()
  }, [])

  return (
    <React.Fragment>
      <PageSection variant='light'>
        <Title headingLevel='h1'>Spring Boot</Title>
      </PageSection>
      <Divider />
      <PageSection type='tabs' hasShadowBottom>
        <Nav aria-label='Spring-boot Nav' variant='tertiary'>
          <NavList>
            {navItems.map(navItem => (
              <NavItem key={navItem.id} isActive={hawtio.fullPath(location.pathname) === hawtio.fullPath(pluginPath, navItem.id)}>
                <NavLink to={hawtio.fullPath(pluginPath, navItem.id)}>{navItem.title}</NavLink>
              </NavItem>
            ))}
          </NavList>
        </Nav>
      </PageSection>
      <Divider />
      <PageSection
        aria-label='Spring-boot Content'
        variant={PageSectionVariants.light}
        padding={{ default: 'noPadding' }}
      >
        <Switch>
          {navItems.map(navItem => (
            <Route key={navItem.id} path={hawtio.fullPath(pluginPath, navItem.id)}>{navItem.component}</Route>
          ))}
          <Route exact path={hawtio.fullPath(pluginPath)}><Redirect to={hawtio.fullPath(pluginPath, navItems[0]?.id ?? '')} /></Route>
        </Switch>
      </PageSection>
    </React.Fragment>
  )
}
