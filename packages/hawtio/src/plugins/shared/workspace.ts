import { eventService, Logger } from '@hawtiosrc/core'
import { jolokiaService } from '@hawtiosrc/plugins/shared/jolokia-service'
import { isString } from '@hawtiosrc/util/objects'
import { IErrorResponse, IResponse, ISimpleOptions } from 'jolokia.js'
import { is, object } from 'superstruct'
import { pluginName } from './globals'
import { MBeanNode, MBeanTree, OptimisedJmxDomain, OptimisedJmxDomains, OptimisedJmxMBean } from './tree'

const log = Logger.get(`${pluginName}-workspace`)

const HAWTIO_REGISTRY_MBEAN = 'hawtio:type=Registry'
const HAWTIO_TREE_WATCHER_MBEAN = 'hawtio:type=TreeWatcher'

export type MBeanCache = { [propertyList: string]: string }

class Workspace {
  private tree: Promise<MBeanTree>
  private pluginRegisterHandle?: Promise<number>
  private pluginUpdateCounter?: number
  private treeWatchRegisterHandle?: Promise<number>
  private treeWatcherCounter?: number

  constructor() {
    this.tree = this.loadTree()
  }

  private async loadTree(): Promise<MBeanTree> {
    log.debug('Load JMX MBean tree')
    const options: ISimpleOptions = {
      ignoreErrors: true,
      error: (response: IErrorResponse) => {
        log.debug('Error fetching JMX tree:', response)
      },
      ajaxError: (xhr: JQueryXHR) => {
        log.debug('Error fetching JMX tree:', xhr)
      },
    }
    try {
      const value = await jolokiaService.list(options)

      const domains = this.unwindResponseWithRBACCache(value)
      log.debug('JMX tree loaded:', domains)

      const tree = await MBeanTree.createFromDomains(pluginName, domains)

      this.maybeMonitorPlugins()
      this.maybeMonitorTree()

      return tree
    } catch (response) {
      log.error('A request to list the JMX tree failed: ' + response)
      return MBeanTree.createEmpty(pluginName)
    }
  }

  /**
   * Processes response from Jolokia LIST - if it contains "domains" and "cache"
   * properties.
   *
   * @param value response value from Jolokia
   */
  private unwindResponseWithRBACCache(value: unknown): OptimisedJmxDomains {
    if (is(value, object({ domains: object(), cache: object() }))) {
      // post process cached RBAC info
      for (const domainName in value.domains) {
        const domain = value.domains[domainName] as OptimisedJmxDomain | MBeanCache
        for (const mbeanName in domain) {
          const mbeanOrCache = domain[mbeanName]
          if (isString(mbeanOrCache)) {
            domain[mbeanName] = value.cache[mbeanOrCache] as OptimisedJmxMBean
          }
        }
      }
      return value.domains as OptimisedJmxDomains
    }
    return value as OptimisedJmxDomains
  }

  /**
   * If the Registry plugin is available then register
   * a callback to refresh the active app plugins in use.
   */
  private async maybeMonitorPlugins() {
    const hasRegistry = await this.treeContainsDomainAndProperties('hawtio', { type: 'Registry' })

    if (hasRegistry) {
      if (!this.pluginRegisterHandle) {
        this.pluginRegisterHandle = jolokiaService.register(
          {
            type: 'read',
            mbean: HAWTIO_REGISTRY_MBEAN,
            attribute: 'UpdateCounter',
          },
          (response: IResponse) => this.maybeUpdatePlugins(response),
        )
      }
    } else {
      if (this.pluginRegisterHandle) {
        const handle = await this.pluginRegisterHandle
        await jolokiaService.unregister(handle)
        this.pluginRegisterHandle = undefined
        this.pluginUpdateCounter = undefined
      }
    }
  }

  /**
   * If the TreeWatcher plugin is available then register
   * a callback to reload the tree in order to refresh
   * the changes.
   */
  private async maybeMonitorTree() {
    const hasTreeWatcher = await this.treeContainsDomainAndProperties('hawtio', { type: 'TreeWatcher' })

    if (hasTreeWatcher) {
      if (!this.treeWatchRegisterHandle) {
        this.treeWatchRegisterHandle = jolokiaService.register(
          {
            type: 'read',
            mbean: HAWTIO_TREE_WATCHER_MBEAN,
            attribute: 'Counter',
          },
          (response: IResponse) => this.maybeReloadTree(response),
        )
      }
    } else {
      if (this.treeWatchRegisterHandle) {
        const handle = await this.treeWatchRegisterHandle
        jolokiaService.unregister(handle)
        this.treeWatchRegisterHandle = undefined
        this.treeWatcherCounter = undefined
      }
    }
  }

  private maybeUpdatePlugins(response: IResponse) {
    const counter = response.value as number
    if (!this.pluginUpdateCounter) {
      // Initial counter setting
      this.pluginUpdateCounter = counter
      return
    }
    if (this.pluginUpdateCounter === counter) {
      return
    }

    // Refresh plugins by reloading page
    log.debug('Plugin update counter changed:', this.pluginUpdateCounter, '->', counter)
    if (jolokiaService.loadAutoRefresh()) {
      log.debug('Update plugins')
      window.location.reload()
    }
  }

  private maybeReloadTree(response: IResponse) {
    const counter = response.value as number
    if (!this.treeWatcherCounter) {
      // Initial counter setting
      this.treeWatcherCounter = counter
      return
    }
    if (this.treeWatcherCounter === counter) {
      return
    }
    // Refresh plugins by reloading page
    log.debug('Tree watcher counter changed:', this.treeWatcherCounter, '->', counter)
    this.treeWatcherCounter = counter as number
    log.debug('Refresh tree')
    this.refreshTree()
  }

  async refreshTree() {
    this.tree = this.loadTree()
    await this.tree
    eventService.refresh()
  }

  async getTree(): Promise<MBeanTree> {
    return this.tree
  }

  /**
   * Returns true if this workspace has any MBeans at all.
   */
  async hasMBeans(): Promise<boolean> {
    return !(await this.tree).isEmpty()
  }

  private matchesProperties(node: MBeanNode, properties: Record<string, unknown>): boolean {
    if (!node) return false

    for (const [k, v] of Object.entries(properties)) {
      switch (k) {
        case 'id':
          if (!node.id.startsWith(v as string) && node.id !== v) return false
          break
        case 'name':
          if (node.name !== v) return false
          break
        case 'icon':
          if (JSON.stringify(node.icon) !== JSON.stringify(v)) return false
          break
      }
    }

    return true
  }

  async treeContainsDomainAndProperties(domainName: string, properties?: Record<string, unknown>): Promise<boolean> {
    const tree = await this.tree
    if (!tree) {
      return false
    }

    const domain = tree.get(domainName)
    if (!domain) {
      return false
    }

    if (properties) {
      const domainAndChildren: MBeanNode[] = [domain]
      domainAndChildren.push(...(domain.children ?? []))
      const checkProperties = (node: MBeanNode) => {
        if (!this.matchesProperties(node, properties)) {
          if (node.children && node.children.length > 0) {
            return node.children.some(checkProperties)
          } else {
            return false
          }
        } else {
          return true
        }
      }
      return domainAndChildren.some(checkProperties)
    }

    return true
  }

  parseMBean(mbean: string): { domain: string; attributes: Record<string, string> } {
    let domain = ''
    const attributes: Record<string, string> = {}
    let parts = mbean.split(':')
    if (parts.length > 1) {
      domain = parts[0] ?? ''
      parts = parts.filter(p => p !== domain)
      const parts2 = parts.join(':')
      const nameValues = parts2.split(',')
      nameValues.forEach(nv => {
        let nameValue = nv.split('=')
        const name = nameValue[0]?.trim() ?? ''
        nameValue = nameValue.filter(nv => nv !== name)
        attributes[name] = nameValue.join('=').trim()
      })
    }
    return { domain, attributes }
  }
}

export const workspace = new Workspace()
