import {
  Card,
  CardBody,
  Nav,
  NavItem,
  NavList,
  PageGroup,
  PageNavigation,
  PageSection,
  PageSectionVariants,
  TextContent,
  Title,
} from '@patternfly/react-core'
import React from 'react'
import Markdown from 'react-markdown'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import help from './help.md'
import { helpRegistry } from './registry'

helpRegistry.add('home', 'Home', help, 1)

export const HawtioHelp: React.FunctionComponent = () => {
  const location = useLocation()
  return (
    <React.Fragment>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel='h1'>Help</Title>
      </PageSection>
      <PageGroup>
        <PageNavigation>
          <Nav aria-label='Nav' variant='tertiary'>
            <NavList>
              {helpRegistry.getHelps().map(help => (
                <NavItem key={help.id} isActive={location.pathname === `/help/${help.id}`}>
                  <NavLink to={help.id}>{help.title}</NavLink>
                </NavItem>
              ))}
            </NavList>
          </Nav>
        </PageNavigation>
      </PageGroup>
      <PageSection>
        <Card isFullHeight>
          <Routes>
            {helpRegistry.getHelps().map(help => (
              <Route
                key={help.id}
                path={help.id}
                element={
                  <CardBody>
                    <TextContent>
                      <Markdown>{help.content}</Markdown>
                    </TextContent>
                  </CardBody>
                }
              />
            ))}
            <Route path='/' element={<Navigate to='home' />} />
          </Routes>
        </Card>
      </PageSection>
    </React.Fragment>
  )
}
