import { Connection, INITIAL_CONNECTION, connectService, jolokiaService, workspace } from '@hawtiosrc/plugins/shared'
import { isBlank } from '@hawtiosrc/util/strings'
import { log } from '../globals'

/**
 * @see https://jolokia.org/reference/html/mbeans.html#mbean-discovery
 */
export type Agent = {
  // Properties from Jolokia API
  agent_id?: string
  agent_description?: string
  agent_version?: string
  url?: string
  secured?: boolean
  server_vendor?: string
  server_product?: string
  server_version?: string

  // Properties that Hawtio attaches
  startTime?: number
  command?: string
}

class DiscoverService {
  async isDiscoverable(): Promise<boolean> {
    return (await this.hasLocalMBean()) || (await this.hasDiscoveryMBean())
  }

  private hasLocalMBean(): Promise<boolean> {
    return workspace.treeContainsDomainAndProperties('hawtio', { type: 'JVMList' })
  }

  private hasDiscoveryMBean(): Promise<boolean> {
    return workspace.treeContainsDomainAndProperties('jolokia', { type: 'Discovery' })
  }

  async discoverAgents(): Promise<Agent[]> {
    // Jolokia 1.x: 'jolokia:type=Discovery'
    // Jolokia 2.x: 'jolokia:type=Discovery,agent=...'
    const discoveryMBean = (await workspace.findMBeans('jolokia', { type: 'Discovery' }))[0]
    if (discoveryMBean && discoveryMBean.objectName) {
      // Use 10 sec timeout
      const agents = (await jolokiaService.execute(discoveryMBean.objectName, 'lookupAgentsWithTimeout(int)', [
        10 * 1000,
      ])) as Agent[]
      await this.fetchMoreJvmDetails(agents)
      return agents
    }

    return []
  }

  private async fetchMoreJvmDetails(agents: Agent[]) {
    for (const agent of agents) {
      if (!agent.url || agent.secured) {
        continue
      }
      // One-off Jolokia instance to connect to the agent
      const jolokia = connectService.createJolokia(this.toConnection(agent))
      agent.startTime = jolokia.getAttribute('java.lang:type=Runtime', 'StartTime') as number
      if (!this.hasName(agent)) {
        // Only look for command if agent vm is not known
        agent.command = jolokia.getAttribute('java.lang:type=Runtime', 'SystemProperties', 'sun.java.command') as string
      }
    }
  }

  toConnection(agent: Agent): Connection {
    const conn = { ...INITIAL_CONNECTION, name: agent.agent_description ?? `discover-${agent.agent_id}` }
    if (!agent.url) {
      log.warn('No URL available to connect to agent:', agent)
      return conn
    }

    const url = new URL(agent.url)
    conn.scheme = url.protocol.substring(0, url.protocol.length - 1) // strip last ':'
    conn.host = url.hostname
    conn.port = parseInt(url.port)
    conn.path = url.pathname

    log.debug('Discover - connection from agent:', conn)
    return conn
  }

  hasName(agent: Agent): boolean {
    return [agent.server_vendor, agent.server_product, agent.server_version].every(s => !isBlank(s))
  }
}

export const discoverService = new DiscoverService()
