import { Connection, INITIAL_CONNECTION, connectService, jolokiaService, workspace } from '@hawtiosrc/plugins/shared'
import { isBlank } from '@hawtiosrc/util/strings'
import { log } from '../globals'

/**
 * @see https://jolokia.org/reference/html/manual/jolokia_mbeans.html#mbean-discovery
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

/**
 * @see https://github.com/hawtio/hawtio/blob/3.x/plugins/hawtio-local-jvm-mbean/src/main/java/io/hawt/jvm/local/VMDescriptorDTO.java
 */
export type Jvm = {
  id: string
  alias: string
  displayName: string
  agentUrl: string | null
  port: number
  hostname: string | null
  scheme: string | null
  path: string | null
}

class DiscoverService {
  hasDiscoveryMBean(): Promise<boolean> {
    return workspace.treeContainsDomainAndProperties('jolokia', { type: 'Discovery' })
  }

  hasLocalMBean(): Promise<boolean> {
    return workspace.treeContainsDomainAndProperties('hawtio', { type: 'JVMList' })
  }

  async discoverAgents(): Promise<Agent[]> {
    // Jolokia 1.x: 'jolokia:type=Discovery'
    // Jolokia 2.x: 'jolokia:type=Discovery,agent=...'
    const discoveryMBean = (await workspace.findMBeans('jolokia', { type: 'Discovery' }))[0]
    if (!discoveryMBean?.objectName) {
      return []
    }

    // Use 10 sec timeout
    const agents = (await jolokiaService.execute(discoveryMBean.objectName, 'lookupAgentsWithTimeout(int)', [
      10 * 1000,
    ])) as Agent[]
    await this.fetchMoreJvmDetails(agents)
    return agents
  }

  async listJvms(): Promise<Jvm[]> {
    const jvmListMBean = (await workspace.findMBeans('hawtio', { type: 'JVMList' }))[0]
    if (!jvmListMBean?.objectName) {
      return []
    }

    return (await jolokiaService.execute(jvmListMBean.objectName, 'listLocalJVMs()')) as Jvm[]
  }

  private async fetchMoreJvmDetails(agents: Agent[]) {
    for (const agent of agents) {
      if (!agent.url || agent.secured) {
        continue
      }
      // One-off Jolokia instance to connect to the agent
      const jolokia = connectService.createJolokia(this.agentToConnection(agent))
      agent.startTime = jolokia.getAttribute('java.lang:type=Runtime', 'StartTime') as number
      if (!this.hasName(agent)) {
        // Only look for command if agent vm is not known
        agent.command = jolokia.getAttribute('java.lang:type=Runtime', 'SystemProperties', 'sun.java.command') as string
      }
    }
  }

  hasName(agent: Agent): boolean {
    return [agent.server_vendor, agent.server_product, agent.server_version].every(s => !isBlank(s))
  }

  agentToConnection(agent: Agent): Connection {
    const conn = {
      ...INITIAL_CONNECTION,
      id: agent.agent_id ?? `discover-${agent.agent_id}`,
      name: agent.agent_description ?? `discover-${agent.agent_id}`,
    }
    if (!agent.url) {
      log.warn('No URL available to connect to agent:', agent)
      return conn
    }

    const url = new URL(agent.url)
    conn.scheme = this.schemeFromUrl(url)
    conn.host = url.hostname
    conn.port = parseInt(url.port)
    conn.path = url.pathname

    log.debug('Discover - connection from agent:', conn)
    return conn
  }

  private schemeFromUrl(url: URL): 'http' | 'https' {
    const scheme = url.protocol.substring(0, url.protocol.length - 1) // strip last ':'
    // Scheme other than 'http' or 'https' is not valid in the context of Jolokia agent
    return scheme === 'http' || scheme === 'https' ? scheme : 'http'
  }

  jvmToConnection(jvm: Jvm): Connection {
    const conn = { ...INITIAL_CONNECTION, name: `local-${jvm.port}` }
    if (!jvm.scheme || !jvm.hostname || jvm.port === 0 || !jvm.path) {
      log.warn('Lack of information to connect to JVM:', jvm)
      return conn
    }

    conn.scheme = jvm.scheme === 'http' || jvm.scheme === 'https' ? jvm.scheme : 'http'
    conn.host = jvm.hostname
    conn.port = jvm.port
    conn.path = jvm.path
    log.debug('Discover - connection from JVM:', conn)
    return conn
  }

  isConnectable(jvm: Jvm): boolean {
    return [jvm.scheme, jvm.hostname, jvm.path].every(s => s && !isBlank(s)) && jvm.port !== 0
  }

  async stopAgent(pid: string) {
    const jvmListMBean = (await workspace.findMBeans('hawtio', { type: 'JVMList' }))[0]
    if (!jvmListMBean?.objectName) {
      return
    }
    log.debug('Discover - stop JVM agent:', jvmListMBean, pid)
    await jolokiaService.execute(jvmListMBean.objectName, 'stopAgent(java.lang.String)', [pid])
  }

  async startAgent(pid: string) {
    const jvmListMBean = (await workspace.findMBeans('hawtio', { type: 'JVMList' }))[0]
    if (!jvmListMBean?.objectName) {
      return
    }
    log.debug('Discover - start JVM agent:', jvmListMBean, pid)
    await jolokiaService.execute(jvmListMBean.objectName, 'startAgent(java.lang.String)', [pid])
  }
}

export const discoverService = new DiscoverService()
