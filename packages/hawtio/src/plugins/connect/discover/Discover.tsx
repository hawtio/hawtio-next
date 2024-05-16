import { Connection, HawtioEmptyCard, HawtioLoadingCard, connectService } from '@hawtiosrc/plugins/shared'
import { formatTimestamp } from '@hawtiosrc/util/dates'
import {
  ActionList,
  ActionListItem,
  Alert,
  Button,
  Card,
  CardActions,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Gallery,
  Label,
  SearchInput,
  Select,
  SelectOption,
  SelectProps,
  Text,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core'
import React, { useContext, useEffect, useState } from 'react'
import { ADD, UPDATE } from '../connections'
import { ConnectContext } from '../context'
import { log } from '../globals'
import javaLogo from '../img/java-logo.svg'
import jettyLogo from '../img/jetty-logo.svg'
import tomcatLogo from '../img/tomcat-logo.svg'
import { Agent, Jvm, discoverService } from './discover-service'

export const Discover: React.FunctionComponent = () => {
  const { connections, dispatch } = useContext(ConnectContext)

  const [agentDiscoverable, setAgentDiscoverable] = useState(false)
  const [jvmListable, setJvmListable] = useState(false)
  const [discovering, setDiscovering] = useState(true)
  const [agents, setAgents] = useState<Agent[]>([])
  const [jvms, setJvms] = useState<Jvm[]>([])

  // Filter
  const [filter, setFilter] = useState('')
  const [label, setLabel] = useState<'Agent' | 'JVM'>('Agent')
  const [isSelectLabelOpen, setIsSelectLabelOpen] = useState(false)
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
  const [filteredJvms, setFilteredJvms] = useState<Jvm[]>([])

  useEffect(() => {
    const isDiscoverable = async () => {
      const discoverable = await discoverService.hasDiscoveryMBean()
      setAgentDiscoverable(discoverable)
      const listable = await discoverService.hasLocalMBean()
      setJvmListable(listable)

      if (!discoverable && listable) {
        setLabel('JVM')
      }

      if (!discoverable && !listable) {
        setDiscovering(false)
      }
    }
    isDiscoverable()
  }, [])

  useEffect(() => {
    if (!discovering) {
      return
    }

    const discover = async () => {
      const agents = await discoverService.discoverAgents()
      log.debug('Discover - agents:', agents)
      setAgents(agents)
      setFilteredAgents(agents)

      const jvms = await discoverService.listJvms()
      log.debug('Discover - JVMs:', jvms)
      setJvms(jvms)
      setFilteredJvms(jvms)

      setDiscovering(false)
    }
    discover()
  }, [discovering])

  if (!agentDiscoverable && !jvmListable) {
    return <HawtioEmptyCard message='Agent discovery is not available' />
  }

  if (discovering) {
    return <HawtioLoadingCard message='Please wait, discovering agents...' />
  }

  const selectLabel: SelectProps['onSelect'] = (_, value) => {
    setLabel(value as typeof label)
    setIsSelectLabelOpen(!isSelectLabelOpen)
  }

  const applyFilter = () => {
    const matchesIgnoringCase = (value: unknown) =>
      typeof value === 'string' && value.toLowerCase().includes(filter.toLowerCase())

    const filteredAgents = agents.filter(agent => Object.values(agent).some(matchesIgnoringCase))
    setFilteredAgents(filteredAgents)

    const filteredJvms = jvms.filter(jvm => Object.values(jvm).some(matchesIgnoringCase))
    setFilteredJvms(filteredJvms)

    log.debug('Discover - apply filter:', filter, 'agents:', filteredAgents, 'JVMs:', filteredJvms)
  }

  const clearFilter = () => {
    setFilter('')
    setFilteredAgents(agents)
    setFilteredJvms(jvms)
  }

  const reset = () => {
    setAgents([])
    setFilteredAgents([])
    setJvms([])
    setFilteredJvms([])
  }

  const refresh = (delay = false) => {
    reset()
    if (delay) {
      // Delay refreshing to show users a pseudo-sense of updating
      setTimeout(() => setDiscovering(true), 100)
    } else {
      setDiscovering(true)
    }
  }

  const connect = (conn: Connection) => {
    log.debug('Discover - connect to:', conn)

    // Save the connection before connecting
    if (connections[conn.id]) {
      dispatch({ type: UPDATE, id: conn.id, connection: conn })
    } else {
      dispatch({ type: ADD, connection: conn })
    }

    connectService.connect(conn)
  }

  const toolbar = (
    <Toolbar id='connect-discover-toolbar'>
      <ToolbarContent>
        <ToolbarGroup id='connect-discover-toolbar-filters'>
          <ToolbarItem id='connect-discover-toolbar-label'>
            <Select
              id='connect-discover-toolbar-label-select'
              variant='single'
              aria-label='Filter Label'
              selections={label}
              isOpen={isSelectLabelOpen}
              onToggle={() => setIsSelectLabelOpen(!isSelectLabelOpen)}
              onSelect={selectLabel}
            >
              <SelectOption key='agent' value='Agent' isDisabled={!agentDiscoverable} />
              <SelectOption key='jvm' value='JVM' isDisabled={!jvmListable} />
            </Select>
          </ToolbarItem>
          <ToolbarItem id='connect-discover-toolbar-filter'>
            <SearchInput
              id='connect-discover-toolbar-filter-input'
              aria-label='Filter Agents'
              placeholder='Filter by text...'
              value={filter}
              onChange={(_, value) => setFilter(value)}
              onSearch={applyFilter}
              onClear={clearFilter}
            />
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarItem variant='separator' />
        <ToolbarItem>
          <Button variant='secondary' onClick={() => refresh(true)} isSmall>
            Refresh
          </Button>
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  )

  return (
    <React.Fragment>
      <Card style={{ marginBottom: '1rem' }} isFlat>
        {toolbar}
      </Card>
      <Gallery hasGutter minWidths={{ default: '400px' }}>
        {label === 'Agent' &&
          filteredAgents.map((agent, index) => (
            <AgentCard key={`agent-${index}-${agent.agent_id}`} agent={agent} connect={connect} />
          ))}
        {label === 'JVM' &&
          filteredJvms.map((jvm, index) => (
            <JvmCard key={`jvm-${index}-${jvm.id}`} jvm={jvm} connect={connect} refresh={refresh} />
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

export const AgentCard: React.FunctionComponent<{
  agent: Agent
  connect: (conn: Connection) => void
}> = ({ agent, connect }) => {
  const productLogo = (agent: Agent) => {
    return PRODUCT_LOGO[agent.server_product?.toLowerCase() ?? 'generic'] ?? PRODUCT_LOGO.generic
  }

  const title = discoverService.hasName(agent) ? (
    `${agent.server_vendor} ${agent.server_product} ${agent.server_version}`
  ) : (
    <Text component='pre'>{agent.command}</Text>
  )

  return (
    <Card isCompact id={`connect-discover-agent-card-${agent.agent_id}`}>
      <CardHeader>
        <img src={productLogo(agent)} alt={agent.server_product} style={{ maxWidth: '30px', paddingRight: '0.5rem' }} />
        <CardTitle style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</CardTitle>
        <CardActions>
          <Label color='blue'>Agent</Label>
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
          {!window.isSecureContext && agent.secured ? (
            <Alert
              variant='danger'
              isInline
              isPlain
              title="Can't connect to secured agent in non-secure browsing context"
            />
          ) : (
            ''
          )}
        </DescriptionList>
      </CardBody>
      <CardFooter>
        <Button
          variant='primary'
          onClick={() => connect(discoverService.agentToConnection(agent))}
          isSmall
          isDisabled={!window.isSecureContext && agent.secured}
        >
          Connect
        </Button>
      </CardFooter>
    </Card>
  )
}

export const JvmCard: React.FunctionComponent<{
  jvm: Jvm
  connect: (conn: Connection) => void
  refresh: () => void
}> = ({ jvm, connect, refresh }) => {
  const stopAgent = () => {
    discoverService.stopAgent(jvm.id)
    refresh()
  }

  const startAgent = () => {
    discoverService.startAgent(jvm.id)
    refresh()
  }

  return (
    <Card isCompact id={`connect-discover-jvm-card-${jvm.id}`}>
      <CardHeader>
        <img src={PRODUCT_LOGO.generic} alt={jvm.alias} style={{ maxWidth: '30px', paddingRight: '0.5rem' }} />
        <CardTitle style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {jvm.alias}
        </CardTitle>
        <CardActions>
          <Label color='green'>JVM</Label>
        </CardActions>
      </CardHeader>
      <CardBody>
        <DescriptionList isCompact isHorizontal>
          <DescriptionListGroup>
            <DescriptionListTerm>PID</DescriptionListTerm>
            <DescriptionListDescription>{jvm.id}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Name</DescriptionListTerm>
            <DescriptionListDescription>{jvm.displayName}</DescriptionListDescription>
          </DescriptionListGroup>
          {jvm.agentUrl && (
            <DescriptionListGroup>
              <DescriptionListTerm>Agent URL</DescriptionListTerm>
              <DescriptionListDescription>
                <Text component='a' href={jvm.agentUrl} target='_blank'>
                  {jvm.agentUrl}
                </Text>
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
      </CardBody>
      <CardFooter>
        <ActionList>
          <ActionListItem>
            <Button
              variant='primary'
              onClick={() => connect(discoverService.jvmToConnection(jvm))}
              isSmall
              isDisabled={!discoverService.isConnectable(jvm)}
            >
              Connect
            </Button>
          </ActionListItem>
          {jvm.agentUrl && (
            <React.Fragment>
              <ActionListItem>
                <Button variant='secondary' onClick={startAgent} isSmall>
                  Start agent
                </Button>
              </ActionListItem>
              <ActionListItem>
                <Button variant='danger' onClick={stopAgent} isSmall>
                  Stop agent
                </Button>
              </ActionListItem>
            </React.Fragment>
          )}
        </ActionList>
      </CardFooter>
    </Card>
  )
}
