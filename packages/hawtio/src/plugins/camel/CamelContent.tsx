import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  Nav,
  NavItem,
  NavList,
  PageGroup,
  PageNavigation,
  PageSection,
  PageSectionVariants,
  Text,
  Title,
} from '@patternfly/react-core'
import './CamelContent.css'
import { CubesIcon } from '@patternfly/react-icons'
import React from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Attributes, Operations, Chart, JmxContentMBeans, MBeanNode } from '@hawtiosrc/plugins/shared'
import { RouteDiagramContext, useRouteDiagramContext } from './route-diagram/route-diagram-context'
import { RouteDiagram } from './route-diagram/RouteDiagram'
import { Contexts } from './contexts'
import { Endpoints } from './endpoints'
import { Exchanges } from './exchanges'
import { TypeConverters } from './type-converters'
import { Debug } from './debug'
import { Trace } from './trace'
import * as ccs from './camel-content-service'
import { CamelRoutes } from './routes/CamelRoutes'
import { Source } from './routes/Source'
import { SendMessage } from './endpoints/SendMessage'

export const CamelContent: React.FunctionComponent = () => {
  const ctx = useRouteDiagramContext()
  const { pathname, search } = useLocation()

  if (!ctx.selectedNode) {
    return (
      <PageSection variant={PageSectionVariants.light} isFilled>
        <EmptyState variant={EmptyStateVariant.full}>
          <EmptyStateIcon icon={CubesIcon} />
          <Title headingLevel='h1' size='lg'>
            Select Camel Node
          </Title>
        </EmptyState>
      </PageSection>
    )
  }

  interface NavItem {
    id: string
    title: string
    component: JSX.Element
    isApplicable(node: MBeanNode | null): boolean
  }

  /**
   * Test if nav should contain general mbean tabs
   */
  const mBeanApplicable = (node: MBeanNode) => {
    return ccs.hasMBean(node) && !ccs.isContextsFolder(node) && !ccs.isRoutesFolder(node) && !ccs.isRouteXmlNode(node)
  }

  // The order of the items in the following list is the order in will the tabs will be visualized.
  // For more info check: https://github.com/hawtio/hawtio-next/issues/237
  const allNavItems: NavItem[] = [
    { id: 'attributes', title: 'Attributes', component: <Attributes />, isApplicable: mBeanApplicable },
    { id: 'operations', title: 'Operations', component: <Operations />, isApplicable: mBeanApplicable },
    {
      id: 'contexts',
      title: 'Contexts',
      component: <Contexts />,
      isApplicable: (node: MBeanNode) => ccs.isContextsFolder(node),
    },
    {
      id: 'routes',
      title: 'Routes',
      component: <CamelRoutes />,
      isApplicable: (node: MBeanNode) => ccs.isRoutesFolder(node),
    },
    {
      id: 'endpoints',
      title: 'Endpoints',
      component: <Endpoints />,
      isApplicable: (node: MBeanNode) => ccs.isEndpointsFolder(node),
    },
    {
      id: 'routeDiagram',
      title: 'Route Diagram',
      component: (
        <RouteDiagramContext.Provider value={ctx}>
          <RouteDiagram />
        </RouteDiagramContext.Provider>
      ),
      isApplicable: (node: MBeanNode) => ccs.isRouteNode(node) || ccs.isRoutesFolder(node),
    },
    {
      id: 'source',
      title: 'Source',
      component: <Source />,
      isApplicable: (node: MBeanNode) =>
        !ccs.isEndpointNode(node) &&
        !ccs.isEndpointsFolder(node) &&
        (ccs.isRouteNode(node) || ccs.isRoutesFolder(node)),
    },
    {
      id: 'send',
      title: 'Send',
      component: <SendMessage />,
      isApplicable: (node: MBeanNode) => ccs.isEndpointNode(node),
    },
    {
      id: 'exchanges',
      title: 'Exchanges',
      component: <Exchanges />,
      isApplicable: (node: MBeanNode) => ccs.hasExchange(node),
    },
    {
      id: 'type-converters',
      title: 'Type Converters',
      component: <TypeConverters />,
      isApplicable: (node: MBeanNode) => ccs.hasTypeConverter(node),
    },
    { id: 'chart', title: 'Chart', component: <Chart />, isApplicable: mBeanApplicable },
    {
      id: 'trace',
      title: 'Trace',
      component: <Trace />,
      isApplicable: (node: MBeanNode) => ccs.canTrace(node),
    },
    {
      id: 'debug',
      title: 'Debug',
      component: <Debug />,
      isApplicable: (node: MBeanNode) => ccs.canGetBreakpoints(node),
    },
  ]

  /* Filter the nav items to those applicable to the selected node */
  const navItems = allNavItems.filter(nav => nav.isApplicable(ctx.selectedNode))

  const camelNav = navItems.length > 0 && (
    <Nav aria-label='Camel Nav' variant='tertiary'>
      <NavList>
        {navItems.map(nav => (
          <NavItem key={nav.id} isActive={pathname === nav.id}>
            <NavLink to={{ pathname: nav.id, search }}>{nav.title}</NavLink>
          </NavItem>
        ))}
      </NavList>
    </Nav>
  )

  const camelNavRoutes = navItems.map(nav => <Route key={nav.id} path={nav.id} element={nav.component} />)

  return (
    <React.Fragment>
      <PageGroup>
        <PageSection variant={PageSectionVariants.light}>
          <Title headingLevel='h1'>{ctx.selectedNode?.name}</Title>
          <Text component='small'>{ctx.selectedNode?.objectName}</Text>
        </PageSection>
        {navItems.length > 0 && <PageNavigation>{camelNav}</PageNavigation>}
      </PageGroup>

      <PageSection className={'camel-main'}>
        {navItems.length > 0 && (
          <Routes>
            {camelNavRoutes}
            <Route key='root' path='/' element={<Navigate to={navItems[0].id} />} />
          </Routes>
        )}
        {navItems.length === 0 && !ctx.selectedNode?.objectName && <JmxContentMBeans />}
      </PageSection>
    </React.Fragment>
  )
}
