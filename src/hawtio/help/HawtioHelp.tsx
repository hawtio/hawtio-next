import { Card, CardBody, Nav, NavItem, NavList, PageGroup, PageNavigation, PageSection, PageSectionVariants, TextContent, Title } from '@patternfly/react-core'
import React from 'react'
import Markdown from 'react-markdown'
import { BrowserRouter, NavLink, Redirect, Route, Switch, useLocation } from 'react-router-dom'
import help from './help.md'
import helpRegistry from './registry'

helpRegistry.add('home', 'Home', help, 1)

type HawtioHelpProps = {
}

const HawtioHelp: React.FunctionComponent<HawtioHelpProps> = props => {
  const location = useLocation()
  return (
    <BrowserRouter>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel="h1">Help</Title>
      </PageSection>
      <PageGroup>
        <PageNavigation>
          <Nav aria-label="Nav" variant="tertiary">
            <NavList>
              {helpRegistry.getHelps().map(help =>
                <NavItem key="home" isActive={location.pathname === '/help/' + help.id}>
                  <NavLink to={'/help/' + help.id}>{help.title}</NavLink>
                </NavItem>
              )}
            </NavList>
          </Nav>
        </PageNavigation>
      </PageGroup>
      <PageSection>
        <Card isFullHeight>
          <Switch>
            {helpRegistry.getHelps().map(help =>
              <Route path={'/help/' + help.id}>
                <CardBody>
                  <TextContent>
                    <Markdown>{help.content}</Markdown>
                  </TextContent>
                </CardBody>
              </Route>
            )}
            <Redirect exact from='/help' to='/help/home' />
          </Switch>
        </Card >
      </PageSection>
    </BrowserRouter>
  )
}

export default HawtioHelp
