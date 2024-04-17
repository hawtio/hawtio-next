import { eventService } from '@hawtiosrc/core'
import { AttributeValues, Attributes, Chart, JmxContentMBeans, MBeanNode, Operations } from '@hawtiosrc/plugins/shared'
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  NavItem,
  PageGroup,
  PageSection,
  PageSectionVariants,
  Tab,
  Tabs,
  Text,
  Title,
} from '@patternfly/react-core'
import { CubesIcon } from '@patternfly/react-icons'
import { Response } from 'jolokia.js'
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './CamelContent.css'
import * as camelService from './camel-service'
import { CamelContext } from './context'
import { Contexts } from './contexts'
import { ContextToolbar } from './contexts/ContextToolbar'
import { ContextState, contextsService } from './contexts/contexts-service'
import { Debug } from './debug'
import { Endpoints } from './endpoints'
import { BrowseMessages } from './endpoints/BrowseMessages'
import { EndpointStats } from './endpoints/EndpointsStats'
import { SendMessage } from './endpoints/SendMessage'
import { Exchanges } from './exchanges'
import { log } from './globals'
import { Profile } from './profile/Profile'
import { Properties } from './properties'
import { RestServices } from './rest-services/RestServices'
import { RouteDiagram } from './route-diagram/RouteDiagram'
import { RouteDiagramContext, useRouteDiagramContext } from './route-diagram/context'
import { CamelRoutes } from './routes/CamelRoutes'
import { Source } from './routes/Source'
import { Trace } from './trace'
import { TypeConverters } from './type-converters'

type NavItem = {
  id: string
  title: string
  component: JSX.Element
  isApplicable: (node: MBeanNode) => boolean
}
/*
 * Test if nav should contain general mbean tabs
 */
const isDefaultApplicable = (node: MBeanNode) => {
  return (
    camelService.hasMBean(node) &&
    !camelService.isContextsFolder(node) &&
    !camelService.isRoutesFolder(node) &&
    !camelService.isRouteXmlNode(node)
  )
}

// The order of the items in the following list is the order in will the tabs will be visualized.
// For more info check: https://github.com/hawtio/hawtio-next/issues/237
const allNavItems: NavItem[] = [
  { id: 'attributes', title: 'Attributes', component: <Attributes />, isApplicable: isDefaultApplicable },
  { id: 'operations', title: 'Operations', component: <Operations />, isApplicable: isDefaultApplicable },
  { id: 'contexts', title: 'Contexts', component: <Contexts />, isApplicable: camelService.isContextsFolder },
  { id: 'routes', title: 'Routes', component: <CamelRoutes />, isApplicable: camelService.isRoutesFolder },
  { id: 'endpoints', title: 'Endpoints', component: <Endpoints />, isApplicable: camelService.isEndpointsFolder },
  {
    id: 'routeDiagram',
    title: 'Route Diagram',
    component: <RouteDiagram />,
    isApplicable: camelService.canViewRouteDiagram,
  },
  {
    id: 'source',
    title: 'Source',
    component: <Source />,
    isApplicable: camelService.canViewSource,
  },
  { id: 'properties', title: 'Properties', component: <Properties />, isApplicable: camelService.hasProperties },
  {
    id: 'send',
    title: 'Send',
    component: <SendMessage />,
    isApplicable: camelService.canSendMessage,
  },
  {
    id: 'browse',
    title: 'Browse',
    component: <BrowseMessages />,
    isApplicable: camelService.canBrowseMessages,
  },
  {
    id: 'endpoint-stats',
    title: 'Endpoints (in/out)',
    component: <EndpointStats />,
    isApplicable: camelService.canViewEndpointStats,
  },
  { id: 'exchanges', title: 'Exchanges', component: <Exchanges />, isApplicable: camelService.hasExchange },
  {
    id: 'rest-services',
    title: 'Rest Services',
    component: <RestServices />,
    isApplicable: camelService.hasRestServices,
  },
  {
    id: 'type-converters',
    title: 'Type Converters',
    component: <TypeConverters />,
    isApplicable: camelService.hasTypeConverter,
  },
  { id: 'chart', title: 'Chart', component: <Chart />, isApplicable: isDefaultApplicable },
  // Applicable for same criteria as trace
  { id: 'profile', title: 'Profile', component: <Profile />, isApplicable: camelService.canTrace },
  { id: 'trace', title: 'Trace', component: <Trace />, isApplicable: camelService.canTrace },
  { id: 'debug', title: 'Debug', component: <Debug />, isApplicable: camelService.canGetBreakpoints },
]
export const CamelContent: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const routeDiagramContext = useRouteDiagramContext()
  const [activeTab, setActiveTab] = useState<string>('')
  const [tabItems, setTabItems] = useState<NavItem[]>([])

  useEffect(() => {
    if (selectedNode) {
      /* Filter the nav items to those applicable to the selected node */
      const tabItems = allNavItems.filter(nav => nav.isApplicable(selectedNode))
      setActiveTab(tabItems[0]?.id ?? '')
      setTabItems([...tabItems])
    }
  }, [selectedNode])

  if (!selectedNode) {
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

  const camelTabs = (
    <Tabs mountOnEnter unmountOnExit activeKey={activeTab} onSelect={(_, eventKey) => setActiveTab(eventKey as string)}>
      {tabItems.map(nav => (
        <Tab eventKey={nav.id} key={nav.id} title={nav.title}>
          {camelService.canViewRouteDiagram(selectedNode) ? (
            <RouteDiagramContext.Provider value={routeDiagramContext}>{nav.component}</RouteDiagramContext.Provider>
          ) : (
            nav.component
          )}
        </Tab>
      ))}
    </Tabs>
  )

  return (
    <PageGroup style={{ height: '100%' }}>
      <PageSection id='camel-content-header' variant={PageSectionVariants.light}>
        {camelService.isContext(selectedNode) && <CamelContentContextToolbar />}
        <Title headingLevel='h1'>{selectedNode.name}</Title>
        {selectedNode.objectName && <Text component='small'>{selectedNode.objectName}</Text>}
      </PageSection>

      <PageSection id='camel-content-main' variant={PageSectionVariants.light}>
        {tabItems.length > 1 && (
          <PageSection isFilled type={'tabs'}>
            {camelTabs}
          </PageSection>
        )}
        {/* Show only the tab content if there is only one tab */}
        {tabItems.length === 1 && !selectedNode.objectName && tabItems[0]!.component}

        {tabItems.length === 0 && <JmxContentMBeans />}
      </PageSection>
    </PageGroup>
  )
}
const CamelContentContextToolbar: React.FunctionComponent = () => {
  const { selectedNode, setSelectedNode } = useContext(CamelContext)
  const [contextState, setContextState] = useState<ContextState | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Attributes only needed if a context has been selected
    if (!selectedNode || !selectedNode.objectName || !camelService.isContext(selectedNode)) {
      return
    }

    const { objectName } = selectedNode
    const readAttributes = async () => {
      const attr = await contextsService.getContext(selectedNode)
      if (attr) setContextState(attr)

      contextsService.register({ type: 'read', mbean: objectName }, (response: Response) => {
        log.debug('Scheduler - Contexts:', response.value)

        // Replace the context in the existing set with the new one
        const attrs = response.value as AttributeValues
        const newAttrs = contextsService.toContextState(selectedNode, attrs)
        if (newAttrs) setContextState(newAttrs)
      })
    }
    readAttributes()

    return () => contextsService.unregisterAll()
  }, [selectedNode])

  /*
   * Callback the is fired after the delete button has been
   * clicked in the toolbar
   */
  const handleDeletedContext = () => {
    setSelectedNode(null)

    // Navigate away from this context as it no longer exists
    navigate('jmx')

    eventService.notify({
      type: 'warning',
      message: 'No Camel domain detected. Redirecting to back to JMX.',
    })
  }

  return <ContextToolbar contexts={contextState ? [contextState] : []} deleteCallback={handleDeletedContext} />
}
