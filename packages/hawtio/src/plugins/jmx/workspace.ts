import { Logger } from '@hawtio/core'
import { jolokiaService } from '@hawtio/plugins/connect/jolokia-service'
import { isString } from '@hawtio/util/strings'
import { IErrorResponse, IJmxDomain, IJmxDomains, IJmxMBean, ISimpleOptions } from 'jolokia.js'
import { is, object } from 'superstruct'
import { pluginName } from './globals'
import { MBeanTree } from './tree'

const log = Logger.get(`${pluginName}-workspace`)

export type MBeanCache = { [propertyList: string]: string }

class Workspace {
  private tree: Promise<MBeanTree>

  constructor() {
    this.tree = new Promise(resolve => {
      this.loadTree().then(tree => resolve(tree))
    })
  }

  private async loadTree(): Promise<MBeanTree> {
    log.debug('Load JMX MBean tree')
    const options: ISimpleOptions = {
      ignoreErrors: true,
      error: (response: IErrorResponse) => {
        log.debug("Error fetching JMX tree:", response)
      },
      ajaxError: (xhr: JQueryXHR) => {
        log.debug("Error fetching JMX tree:", xhr)
      }
    }
    const value = await jolokiaService.list(options)
    // TODO: this.jolokiaStatus.xhr = null
    const domains = this.unwindResponseWithRBACCache(value)
    log.debug("JMX tree loaded:", domains)
    return new MBeanTree(domains)
  }

  /**
   * Processes response from Jolokia LIST - if it contains "domains" and "cache"
   * properties.
   *
   * @param value response value from Jolokia
   */
  private unwindResponseWithRBACCache(value: unknown): IJmxDomains {
    if (is(value, object({ domains: object(), cache: object() }))) {
      // post process cached RBAC info
      for (const domainName in value.domains) {
        const domain = value.domains[domainName] as IJmxDomain | MBeanCache
        for (const mbeanName in domain) {
          const mbeanOrCache = domain[mbeanName]
          if (isString(mbeanOrCache)) {
            domain[mbeanName] = value.cache[mbeanOrCache] as IJmxMBean
          }
        }
      }
      return value.domains as IJmxDomains
    }
    return value as IJmxDomains
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
}

export const workspace = new Workspace()
