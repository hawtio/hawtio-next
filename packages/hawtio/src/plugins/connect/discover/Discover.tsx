import { HawtioEmptyCard, HawtioLoadingCard, connectService } from '@hawtiosrc/plugins/shared'
import { formatTimestamp } from '@hawtiosrc/util/dates'
import {
  Button,
  Card,
  CardActions,
  CardBody,
  CardHeader,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Gallery,
  SearchInput,
  Text,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core'
import React, { useContext, useEffect, useState } from 'react'
import { ADD, UPDATE } from '../connections'
import { ConnectContext } from '../context'
import { log } from '../globals'
import javaLogo from '../img/java-logo.svg'
import jettyLogo from '../img/jetty-logo.svg'
import tomcatLogo from '../img/tomcat-logo.svg'
import { Agent, discoverService } from './discover-service'

export const Discover: React.FunctionComponent = () => {
  const [discoverable, setDiscoverable] = useState(false)
  const [discovering, setDiscovering] = useState(true)
  const [agents, setAgents] = useState<Agent[]>([])

  // Filter
  const [filter, setFilter] = useState('')
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])

  useEffect(() => {
    if (!discovering) {
      return
    }

    const isDiscoverable = async () => {
      const discoverable = await discoverService.isDiscoverable()
      setDiscoverable(discoverable)
      setDiscovering(false)
    }
    isDiscoverable()

    setDiscovering(true)
    const discoverAgents = async () => {
      const agents = await discoverService.discoverAgents()
      log.debug('Discover - agents:', agents)
      setAgents(agents)
      setFilteredAgents(agents)
      setDiscovering(false)
    }
    discoverAgents()
  }, [discovering])

  if (discovering) {
    return <HawtioLoadingCard message='Please wait, discovering agents...' />
  }

  if (!discoverable) {
    return <HawtioEmptyCard message='Agent discovery is not available' />
  }

  const applyFilter = () => {
    const filtered = agents.filter(agent =>
      Object.values(agent).some(value => typeof value === 'string' && value.includes(filter)),
    )
    log.debug('Discover - apply filter:', filter, filtered)
    setFilteredAgents(filtered)
  }

  const clearFilter = () => {
    setFilter('')
    setFilteredAgents(agents)
  }

  const refresh = () => {
    setDiscovering(true)
  }

  const toolbar = (
    <Toolbar id='connect-discover-toolbar'>
      <ToolbarContent>
        <ToolbarItem id='connect-discover-toolbar-filter'>
          <SearchInput
            id='connect-discover-toolbar-filter-input'
            aria-label='Filter Agents'
            placeholder='Filter agents...'
            value={filter}
            onChange={(_, value) => setFilter(value)}
            onSearch={applyFilter}
            onClear={clearFilter}
          />
        </ToolbarItem>
        <ToolbarItem variant='separator' />
        <ToolbarItem>
          <Button variant='secondary' onClick={refresh} isSmall>
            Refresh
          </Button>
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  )

  return (
    <React.Fragment>
      <Card style={{ marginBottom: '1rem' }}>{toolbar}</Card>
      <Gallery hasGutter minWidths={{ default: '400px' }}>
        {filteredAgents.map((agent, index) => (
          <AgentCard key={`agent-${index}-${agent.agent_id}`} agent={agent} />
        ))}
      </Gallery>
    </React.Fragment>
  )
}

const PRODUCT_LOGO: Record<string, string> = {
  jetty: jettyLogo,
  tomcat: tomcatLogo,
  generic: javaLogo,
}

export const AgentCard: React.FunctionComponent<{ agent: Agent }> = ({ agent }) => {
  const { connections, dispatch } = useContext(ConnectContext)

  const connect = () => {
    const conn = discoverService.toConnection(agent)
    log.debug('Discover - connect to:', conn)

    // Save the connection before connecting
    if (connections[conn.name]) {
      dispatch({ type: UPDATE, name: conn.name, connection: conn })
    } else {
      dispatch({ type: ADD, connection: conn })
    }

    connectService.connect(conn)
  }

  const productLogo = (agent: Agent) => {
    return PRODUCT_LOGO[agent.server_product?.toLowerCase() ?? 'generic'] ?? PRODUCT_LOGO.generic
  }

  return (
    <Card isCompact id={`connect-discover-agent-card-${agent.agent_id}`}>
      <CardHeader>
        <img src={productLogo(agent)} alt={agent.server_product} style={{ maxWidth: '30px', paddingRight: '0.5rem' }} />
        {discoverService.hasName(agent) && (
          <CardTitle>
            {agent.server_vendor} {agent.server_product} {agent.server_version}
          </CardTitle>
        )}
        {agent.command && (
          <CardTitle>
            <Text component='pre'>{agent.command}</Text>
          </CardTitle>
        )}
        <CardActions>
          <Button variant='primary' onClick={connect} isSmall>
            Connect
          </Button>
        </CardActions>
      </CardHeader>
      <CardBody>
        <DescriptionList isCompact isHorizontal>
          <DescriptionListGroup>
            <DescriptionListTerm>Agent ID</DescriptionListTerm>
            <DescriptionListDescription>{agent.agent_id}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Agent Version</DescriptionListTerm>
            <DescriptionListDescription>{agent.agent_version}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Agent Description</DescriptionListTerm>
            <DescriptionListDescription>{agent.agent_description}</DescriptionListDescription>
          </DescriptionListGroup>
          {agent.startTime && (
            <DescriptionListGroup>
              <DescriptionListTerm>JVM Started</DescriptionListTerm>
              <DescriptionListDescription>{formatTimestamp(new Date(agent.startTime))}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
          {agent.url && (
            <DescriptionListGroup>
              <DescriptionListTerm>Agent URL</DescriptionListTerm>
              <DescriptionListDescription>
                <Text component='a' href={agent.url} target='_blank'>
                  {agent.url}
                </Text>
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
      </CardBody>
    </Card>
  )
}
