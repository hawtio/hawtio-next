import {
  CardBody,
  Divider,
  Nav,
  NavItem,
  NavList,
  PageSection,
  PageSectionVariants,
  TextContent,
  Title,
} from '@patternfly/react-core'
import React, { useMemo } from 'react'
import Markdown from 'react-markdown'
import { NavLink, Redirect, Route, Switch, useLocation } from 'react-router-dom' // includes NavLink
import help from './help.md'
import { helpRegistry } from './registry'
import { hawtio, usePlugins } from '@hawtiosrc/core'
import { HELP, INDEX, HOME } from '@hawtiosrc/RouteConstants'

helpRegistry.add(HOME, 'Home', help, 1)

export const HawtioHelp: React.FunctionComponent = () => {
  const location = useLocation()
  const { plugins } = usePlugins()

  const helps = useMemo(() => {
    const pluginIds = hawtio.getPlugins().map(p => p.id)
    const activePlugins = plugins.map(p => p.id)
    return helpRegistry.getHelps().filter(help => {
      if (pluginIds.includes(help.id)) {
        return activePlugins.includes(help.id)
      }
      return true
    })
  }, [plugins])

  return (
    <React.Fragment>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel='h1'>Help</Title>
      </PageSection>
      <Divider />

      <PageSection type='tabs' hasShadowBottom>
        <Nav aria-label='Nav' variant='tertiary'>
          <NavList>
            {helps.map(help => (
              <NavItem key={help.id} isActive={location.pathname === hawtio.fullPath(HELP, help.id)}>
                <NavLink to={hawtio.fullPath(HELP, help.id)}>{help.title}</NavLink>
              </NavItem>
            ))}
          </NavList>
        </Nav>
      </PageSection>
      <Divider />
      <PageSection variant={PageSectionVariants.light}>
        <Switch>
          {helpRegistry.getHelps().map(help => (
            <Route
              key={help.id}
              path={hawtio.fullPath(HELP, help.id)} >
                <CardBody>
                  <TextContent>
                    <Markdown>{help.content}</Markdown>
                  </TextContent>
                </CardBody>
            </Route>
          ))}
          <Route path={INDEX}><Redirect to={hawtio.fullPath(HELP, HOME)} /></Route>
        </Switch>
      </PageSection>
    </React.Fragment>
  )
}
