import { helpRegistry } from '@hawtiosrc/help/registry'
import { Divider, Nav, NavItem, NavList, PageSection, PageSectionVariants, Title } from '@patternfly/react-core'
import React from 'react'
import { NavLink, Redirect, Route, Switch, useLocation } from 'react-router-dom' // includes NavLink
import help from './help.md'
import { HomePreferences } from './HomePreferences'
import { LogsPreferences } from './LogsPreferences'
import { preferencesRegistry } from './registry'
import { hawtio } from '@hawtiosrc/core'
import { HOME, PREFERENCES } from '@hawtiosrc/RouteConstants'

helpRegistry.add('preferences', 'Preferences', help, 2)
preferencesRegistry.add('home', 'Home', HomePreferences, 1)
preferencesRegistry.add('console-logs', 'Console Logs', LogsPreferences, 2)

export const HawtioPreferences: React.FunctionComponent = () => {
  const location = useLocation()
  return (
    <React.Fragment>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel='h1'>Preferences</Title>
      </PageSection>
      <Divider />
      <PageSection type='tabs' hasShadowBottom>
        <Nav aria-label='Nav' variant='tertiary'>
          <NavList>
            {preferencesRegistry.getPreferences().map(prefs => (
              <NavItem
                key={prefs.id}
                isActive={hawtio.fullPath(location.pathname) === hawtio.fullPath(PREFERENCES, prefs.id)}
              >
                <NavLink to={hawtio.fullPath(PREFERENCES, prefs.id)}>{prefs.title}</NavLink>
              </NavItem>
            ))}
          </NavList>
        </Nav>
      </PageSection>
      <Divider />
      <PageSection variant={PageSectionVariants.light}>
        <Switch>
          {preferencesRegistry.getPreferences().map(prefs => (
            <Route key={prefs.id} path={hawtio.fullPath(PREFERENCES, prefs.id)}>
              {React.createElement(prefs.component)}
            </Route>
          ))}
          <Route exact path={hawtio.fullPath(PREFERENCES)}>
            <Redirect to={hawtio.fullPath(PREFERENCES, HOME)} />
          </Route>
        </Switch>
      </PageSection>
    </React.Fragment>
  )
}
