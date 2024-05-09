import { helpRegistry } from '@hawtiosrc/help/registry'
import { Divider, Nav, NavItem, NavList, PageSection, PageSectionVariants, Title } from '@patternfly/react-core'
import React from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import help from './help.md'
import { HomePreferences } from './HomePreferences'
import { LogsPreferences } from './LogsPreferences'
import { preferencesRegistry } from './registry'

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
              <NavItem key={prefs.id} isActive={location.pathname === `/preferences/${prefs.id}`}>
                <NavLink to={prefs.id}>{prefs.title}</NavLink>
              </NavItem>
            ))}
          </NavList>
        </Nav>
      </PageSection>
      <Divider />
      <PageSection variant={PageSectionVariants.light}>
        <Routes>
          {preferencesRegistry.getPreferences().map(prefs => (
            <Route key={prefs.id} path={prefs.id} element={React.createElement(prefs.component)} />
          ))}
          <Route path='/' element={<Navigate to={'home'} />} />
        </Routes>
      </PageSection>
    </React.Fragment>
  )
}
