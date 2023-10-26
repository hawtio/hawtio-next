import { userService } from '@hawtiosrc/auth'
import { eventService, Logger } from '@hawtiosrc/core'
import { jolokiaService } from '@hawtiosrc/plugins/shared/jolokia-service'
import { isString } from '@hawtiosrc/util/objects'
import { ErrorResponse, ListRequestOptions, Response } from 'jolokia.js'
import { is, object } from 'superstruct'
import { pluginName } from './globals'
import { MBeanNode, MBeanTree, OptimisedJmxDomain, OptimisedJmxDomains, OptimisedMBeanInfo } from './tree'

const log = Logger.get(`${pluginName}-workspace`)

const HAWTIO_REGISTRY_MBEAN = 'hawtio:type=Registry'
const HAWTIO_TREE_WATCHER_MBEAN = 'hawtio:type=TreeWatcher'

export type MBeanCache = { [propertyList: string]: string }

export interface IWorkspace {
  refreshTree(): Promise<void>
  getTree(): Promise<MBeanTree>
  hasMBeans(): Promise<boolean>
  treeContainsDomainAndProperties(domainName: string, properties?: Record<string, unknown>): Promise<boolean>
  findMBeans(domainName: string, properties: Record<string, unknown>): Promise<MBeanNode[]>
}

class Workspace implements IWorkspace {
  private tree?: Promise<MBeanTree>

  private pluginRegisterHandle?: Promise<number>
  private pluginUpdateCounter?: number
  private treeWatchRegisterHandle?: Promise<number>
  private treeWatcherCounter?: number

  async refreshTree() {
    this.tree = undefined
    await this.getTree()
    eventService.refresh()
  }

  getTree(): Promise<MBeanTree> {
    if (this.tree) {
      return this.tree
    }

    this.tree = this.loadTree()
    return this.tree
  }

  private async loadTree(): Promise<MBeanTree> {
    if (!(await userService.isLogin())) {
      throw new Error('User needs to have logged in to use workspace')
    }

    log.debug('Load JMX MBean tree')
    const options: ListRequestOptions = {
      ignoreErrors: true,
      error: (response: ErrorResponse) => {
        log.debug('Error - fetching JMX tree:', response)
      },
      ajaxError: (xhr: JQueryXHR, text: string, error: string) => {
        log.debug('Ajax error - fetching JMX tree:', text, '-', error)
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
            domain[mbeanName] = value.cache[mbeanOrCache] as OptimisedMBeanInfo
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
          (response: Response) => this.maybeUpdatePlugins(response),
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
          (response: Response) => this.maybeReloadTree(response),
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

  private maybeUpdatePlugins(response: Response) {
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

  private maybeReloadTree(response: Response) {
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

  /**
   * Returns true if this workspace has any MBeans at all.
   */
  async hasMBeans(): Promise<boolean> {
    const tree = await this.getTree()
    return !tree.isEmpty()
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
    const tree = await this.getTree()
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

  /**
   * Finds MBeans in the workspace based on the domain name and properties.
   */
  async findMBeans(domainName: string, properties: Record<string, string>): Promise<MBeanNode[]> {
    const tree = await this.getTree()
    return tree.findMBeans(domainName, properties)
  }
}

export const workspace: IWorkspace = new Workspace()
