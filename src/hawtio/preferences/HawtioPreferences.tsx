import helpRegistry from '@hawtio/help/registry'
import { Card, Nav, NavItem, NavList, PageGroup, PageNavigation, PageSection, PageSectionVariants, Title } from '@patternfly/react-core'
import React from 'react'
import { BrowserRouter, NavLink, Redirect, Route, Switch, useLocation } from 'react-router-dom'
import help from './help.md'
import HomePreferences from './HomePreferences'
import LogsPreferences from './LogsPreferences'
import preferencesRegistry from './registry'

helpRegistry.add('preferences', 'Preferences', help, 2)
preferencesRegistry.add('home', 'Home', HomePreferences, 1)
preferencesRegistry.add('logs', 'Logs', LogsPreferences, 2)

type HawtioPreferencesProps = {
}

const HawtioPreferences: React.FunctionComponent<HawtioPreferencesProps> = props => {
  const location = useLocation()
  const path = (id: string) => `/preferences/${id}`
  return (
    <BrowserRouter>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel="h1">Preferences</Title>
      </PageSection>
      <PageGroup>
        <PageNavigation>
          <Nav aria-label="Nav" variant="tertiary">
            <NavList>
              {preferencesRegistry.getPreferences().map(prefs =>
                <NavItem key={prefs.id} isActive={location.pathname === path(prefs.id)}>
                  <NavLink to={path(prefs.id)}>{prefs.title}</NavLink>
                </NavItem>
              )}
            </NavList>
          </Nav>
        </PageNavigation>
      </PageGroup>
      <PageSection>
        <Card isFullHeight>
          <Switch>
            {preferencesRegistry.getPreferences().map(prefs => (
              <Route
                key={prefs.id}
                path={path(prefs.id)}
                component={prefs.component} />
            ))}
            <Redirect exact from='/preferences' to={path('home')} />
          </Switch>
        </Card >
      </PageSection>
    </BrowserRouter>
  )
}

export default HawtioPreferences
