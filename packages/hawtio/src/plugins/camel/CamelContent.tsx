import { eventService } from '@hawtiosrc/core'
import { Attributes, JmxContentMBeans, MBeanNode, Operations } from '@hawtiosrc/plugins/shared'
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
import { CubesIcon } from '@patternfly/react-icons'
import { IResponse } from 'jolokia.js'
import React, { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AttributeValues } from '../connect'
import './CamelContent.css'
import * as ccs from './camel-content-service'
import { Contexts } from './contexts'
import { ContextToolbar } from './contexts/ContextToolbar'
import { ContextAttributes, contextsService } from './contexts/contexts-service'
import { Debug } from './debug'
import { Endpoints } from './endpoints'
import { BrowseMessages } from './endpoints/BrowseMessages'
import { SendMessage } from './endpoints/SendMessage'
import { Exchanges } from './exchanges'
import { log, pluginPath } from './globals'
import { Profile } from './profile/Profile'
import { RestServices } from './rest-services/RestServices'
import { RouteDiagram } from './route-diagram/RouteDiagram'
import { RouteDiagramContext, useRouteDiagramContext } from './route-diagram/route-diagram-context'
import { CamelRoutes } from './routes/CamelRoutes'
import { Source } from './routes/Source'
import { Trace } from './trace'
import { TypeConverters } from './type-converters'

export const CamelContent: React.FunctionComponent = () => {
  const ctx = useRouteDiagramContext()
  const [ctxAttributes, setCtxAttributes] = useState<ContextAttributes | null>()
  const { pathname, search } = useLocation()
  const navigate = useNavigate()

  /**
   * Attributes only needed if a context has been selected
   */
  useEffect(() => {
    const readAttributes = async () => {
      if (!ctx.selectedNode) return

      if (!ccs.isContext(ctx.selectedNode as MBeanNode)) {
        return
      }

      const attr = await contextsService.getContext(ctx.selectedNode)
      if (attr) setCtxAttributes(attr)

      const name = ctx.selectedNode.name as string
      const mbean = ctx.selectedNode.objectName as string
      contextsService.register({ type: 'read', mbean }, (response: IResponse) => {
        log.debug('Scheduler - Contexts:', response.value)

        /* Replace the context in the existing set with the new one */
        const newCtxAttr: ContextAttributes = contextsService.createContextAttibutes(
          name,
          mbean,
          response.value as AttributeValues,
        )

        setCtxAttributes(newCtxAttr)
      })
    }
    readAttributes()

    return () => contextsService.unregisterAll()
  }, [ctx.selectedNode])

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
      id: 'browse',
      title: 'Browse',
      component: <BrowseMessages />,
      isApplicable: (node: MBeanNode) => ccs.isEndpointNode(node) && ccs.canBrowseMessages(node),
    },
    {
      id: 'exchanges',
      title: 'Exchanges',
      component: <Exchanges />,
      isApplicable: (node: MBeanNode) => ccs.hasExchange(node),
    },
    {
      id: 'rest-services',
      title: 'Rest Services',
      component: <RestServices />,
      isApplicable: (node: MBeanNode) => ccs.hasRestServices(node),
    },
    {
      id: 'type-converters',
      title: 'Type Converters',
      component: <TypeConverters />,
      isApplicable: (node: MBeanNode) => ccs.hasTypeConverter(node),
    },
    //{ id: 'chart', title: 'Chart', component: <Chart />, isApplicable: mBeanApplicable },
    {
      id: 'profile',
      title: 'Profile',
      component: <Profile />,
      // Applicable for same criteria as trace
      isApplicable: (node: MBeanNode) => ccs.canTrace(node),
    },
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
          <NavItem key={nav.id} isActive={pathname === `${pluginPath}/${nav.id}`}>
            <NavLink to={{ pathname: nav.id, search }}>{nav.title}</NavLink>
          </NavItem>
        ))}
      </NavList>
    </Nav>
  )

  const camelNavRoutes = navItems.map(nav => <Route key={nav.id} path={nav.id} element={nav.component} />)

  /*
   * Callback the is fired after the delete button has been
   * clicked in the toolbar
   */
  const handleDeletedContext = () => {
    ctx.setSelectedNode(null)

    // Navigate away from this context as it no longer exists
    navigate('jmx')

    eventService.notify({
      type: 'warning',
      message: 'No Camel domain detected. Redirecting to back to jmx.',
    })
  }

  return (
    <React.Fragment>
      <PageGroup>
        <PageSection id='camel-content-header' variant={PageSectionVariants.light} hasShadowBottom>
          {ccs.isContext(ctx.selectedNode) && (
            <ContextToolbar contexts={!ctxAttributes ? [] : [ctxAttributes]} deleteCallback={handleDeletedContext} />
          )}
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
