import $ from 'jquery'
import { log } from './globals'

export interface Plugin {
  id: string
  title: string
  path: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>

  /**
   * Returns if this plugin should be activated.
   * This method needs to return a promise as the process of resolving if a plugin
   * should be activated may require information collected asynchronously such as
   * the existence of some MBeans, etc.
   */
  isActive: () => Promise<boolean>
}

type Plugins = {
  [id: string]: Plugin
}

/**
 * Hawtio core service.
 *
 * This service provides the following functionalities:
 * - Base path provisioning
 * - Plugin loader and discovery mechanism
 */
class HawtioCore {
  /**
   * Hawtio base path.
   */
  private basePath?: string

  /**
   * List of URLs that the plugin loader will try and discover plugins from.
   */
  private urls: string[] = []

  /**
   * Holds all of the Hawtio plugins that need to be bootstrapped.
   */
  private plugins: Plugins = {}

  setBasePath(path: string) {
    this.basePath = path
  }

  getBasePath(): string | undefined {
    if (!this.basePath) {
      this.basePath = this.documentBase()
    }
    return this.basePath
  }

  private documentBase(): string | undefined {
    const base = $('head').find('base')
    if (base && base.length > 0) {
      return base.attr('href')
    }
    return undefined
  }

  /**
   * Adds an angular module to the list of modules to bootstrap.
   */
  addPlugin(plugin: Plugin): HawtioCore {
    log.info('Add plugin:', plugin.id)
    if (this.plugins[plugin.id]) {
      throw new Error(`Plugin "${plugin.id}" already exists`)
    }
    this.plugins[plugin.id] = plugin
    return this
  }

  /**
   * Adds a URL for discovering plugins.
   */
  addUrl(url: string): HawtioCore {
    log.info('Add URL:', url)
    this.urls.push(url)
    return this
  }

  /**
   * Bootstraps Hawtio.
   */
  bootstrap() {
    this.loadPlugins(plugins => {
      log.info('Plugins loaded:', plugins)
    })
    log.info('Bootstrapped Hawtio')
  }

  /**
   * Downloads plugins at any configured URLs and bootstraps the app.
   *
   * It is invoked from Hawtio's bootstrapping.
   */
  private loadPlugins(callback: (plugins: Plugins) => void): void {
    log.info('Bootstrapping Hawtio...')

    // TODO: Load external plugins

    callback(this.plugins)
  }

  getPlugins(): Plugin[] {
    return Object.values(this.plugins)
  }

  /**
   * Resolves which of registered plugins are active with the current environment.
   */
  async resolvePlugins(): Promise<Plugin[]> {
    // load plugins sequentially to maintain the order
    const resolved: Plugin[] = []
    for (const plugin of this.getPlugins()) {
      if (await plugin.isActive()) {
        resolved.push(plugin)
      }
    }
    return resolved
  }
}

/**
 * Hawtio core singleton instance.
 */
export const hawtio = new HawtioCore()
