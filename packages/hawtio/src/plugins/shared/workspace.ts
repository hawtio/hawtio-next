import { userService } from '@hawtiosrc/auth'
import { configManager, eventService, JmxConfig, Logger } from '@hawtiosrc/core'
import { jolokiaService } from '@hawtiosrc/plugins/shared/jolokia-service'
import Jolokia, { JolokiaErrorResponse, JolokiaFetchErrorResponse, JolokiaSuccessResponse } from 'jolokia.js'
import { pluginName } from './globals'
import { MBeanNode, MBeanTree } from './tree'
import { SimpleRequestOptions } from '@jolokia.js/simple'

const log = Logger.get(`${pluginName}-workspace`)

const HAWTIO_REGISTRY_MBEAN = 'hawtio:type=Registry'
const HAWTIO_TREE_WATCHER_MBEAN = 'hawtio:type=TreeWatcher'

export interface IWorkspace {
  hasErrors(): Promise<boolean>
  getErrors(): Promise<Error[]>
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
  private _errors: Error[] = []

  async hasErrors(): Promise<boolean> {
    await this.getTree()
    return this._errors.length > 0
  }

  async getErrors(): Promise<Error[]> {
    await this.getTree()
    return this._errors
  }

  addError(error: Error) {
    this._errors.push(error)
  }

  async refreshTree() {
    this.tree = undefined
    this._errors = []
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
      this.addError(new Error('User needs to have logged in to use workspace'))
      throw new Error('User needs to have logged in to use workspace')
    }

    const config = await this.getConfig()
    if (config.workspace === false || (typeof config.workspace !== 'boolean' && config.workspace?.length === 0)) {
      // TODO Should this set the error??
      return MBeanTree.createEmpty(pluginName)
    }
    const mbeanPaths = config.workspace && typeof config.workspace !== 'boolean' ? config.workspace : []

    log.debug('Load JMX MBean tree:', mbeanPaths)
    const options: SimpleRequestOptions = {
      ignoreErrors: true,
      error: (response: JolokiaErrorResponse) => {
        this.addError(
          new Error(`Error - fetching JMX tree: ${response.error_type} ${response.error} ${response.error_value}`),
        )
        log.debug('Error - fetching JMX tree:', response)
      },
      fetchError: (response: Response | null, error: DOMException | TypeError | string | null) => {
        const text = response?.statusText || error
        const err = new Error(`Ajax error - fetching JMX tree: ${text}`)
        err.cause = error
        this.addError(err)

        log.debug('Ajax error - fetching JMX tree:', text, '-', error)
      },
    }
    try {
      const domains = await (mbeanPaths.length > 0
        ? jolokiaService.sublist(mbeanPaths, options)
        : jolokiaService.list(options))
      log.debug('JMX tree loaded:', domains)

      const tree = await MBeanTree.createFromDomains(pluginName, domains)

      this.maybeMonitorPlugins()
      this.maybeMonitorTree()

      return tree
    } catch (error) {
      const wkspError: Error = new Error('A request to list the JMX tree failed')
      wkspError.cause = error
      this.addError(wkspError)

      log.error(wkspError.message, error)
      return MBeanTree.createEmpty(pluginName)
    }
  }

  private async getConfig(): Promise<JmxConfig> {
    const { jmx } = await configManager.getHawtconfig()
    return jmx ?? {}
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
          (response: JolokiaSuccessResponse | JolokiaErrorResponse | JolokiaFetchErrorResponse) =>
            this.maybeUpdatePlugins(response),
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
          (response: JolokiaSuccessResponse | JolokiaErrorResponse | JolokiaFetchErrorResponse) =>
            this.maybeReloadTree(response),
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

  private maybeUpdatePlugins(response: JolokiaSuccessResponse | JolokiaErrorResponse | JolokiaFetchErrorResponse) {
    if (Jolokia.isResponseFetchError(response)) {
      return
    }
    const counter = typeof response === 'object' && 'value' in response ? (response.value as number) : 0
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

  private maybeReloadTree(response: JolokiaSuccessResponse | JolokiaErrorResponse | JolokiaFetchErrorResponse) {
    if (Jolokia.isResponseFetchError(response)) {
      return
    }
    const counter = typeof response === 'object' && 'value' in response ? (response.value as number) : 0
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
