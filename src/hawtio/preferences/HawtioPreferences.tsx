import { Card, Nav, NavItem, NavList, PageGroup, PageNavigation, PageSection, PageSectionVariants, Title } from '@patternfly/react-core'
import React from 'react'
import { BrowserRouter, NavLink, Redirect, Route, Switch, useLocation } from 'react-router-dom'
import HomePreferences from './HomePreferences'
import LogsPreferences from './LogsPreferences'
import help from './help.md'
import helpRegistry from '@hawtio/help/registry'

helpRegistry.add('preferences', 'Preferences', help, 2)

type HawtioPreferencesProps = {
}

const HawtioPreferences: React.FunctionComponent<HawtioPreferencesProps> = props => {
  const location = useLocation()
  return (
    <BrowserRouter>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel="h1">Preferences</Title>
      </PageSection>
      <PageGroup>
        <PageNavigation>
          <Nav aria-label="Nav" variant="tertiary">
            <NavList>
              <NavItem key="home" isActive={location.pathname === '/preferences/home'}>
                <NavLink to='/preferences/home'>Home</NavLink>
              </NavItem>
              <NavItem key="logs" isActive={location.pathname === '/preferences/logs'}>
                <NavLink to='/preferences/logs'>Console Logs</NavLink>
              </NavItem>
            </NavList>
          </Nav>
        </PageNavigation>
      </PageGroup>
      <PageSection>
        <Card isFullHeight>
          <Switch>
            <Route path='/preferences/home'>
              <HomePreferences />
            </Route>
            <Route path='/preferences/logs'>
              <LogsPreferences />
            </Route>
            <Redirect exact from='/preferences' to='/preferences/home' />
          </Switch>
        </Card >
      </PageSection>
    </BrowserRouter>
  )
}

export default HawtioPreferences
