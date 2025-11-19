import { CardBody, Divider, Nav, NavItem, NavList, PageSection, Content, Title } from '@patternfly/react-core'
import React, { useMemo } from 'react'
import Markdown from 'react-markdown'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import help from './help.md'
import { helpRegistry } from './registry'
import { hawtio, usePlugins } from '@hawtiosrc/core'

helpRegistry.add('home', 'Home', help, 1)

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
      <PageSection hasBodyWrapper={false}>
        <Title headingLevel='h1'>Help</Title>
      </PageSection>
      <Divider />

      <PageSection hasBodyWrapper={false} type='tabs' hasShadowBottom>
        <Nav aria-label='Nav' variant='horizontal-subnav'>
          <NavList>
            {helps.map(help => (
              <NavItem key={help.id} isActive={location.pathname === `/help/${help.id}`}>
                <NavLink to={help.id}>{help.title}</NavLink>
              </NavItem>
            ))}
          </NavList>
        </Nav>
      </PageSection>
      <Divider />
      <PageSection hasBodyWrapper={false}>
        <Routes>
          {helpRegistry.getHelps().map(help => (
            <Route
              key={help.id}
              path={help.id}
              element={
                <CardBody>
                  <Content>
                    <Markdown>{help.content}</Markdown>
                  </Content>
                </CardBody>
              }
            />
          ))}
          <Route path='/' element={<Navigate to='home' />} />
        </Routes>
      </PageSection>
    </React.Fragment>
  )
}
