import { importRemote, ImportRemoteOptions } from '@module-federation/utilities'
import $ from 'jquery'
import { eventService } from './event-service'
import { log } from './globals'

/**
 * Internal representation of a Hawtio plugin.
 */
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

/**
 * A collection of internal Hawtio plugins with IDs as keys.
 */
type Plugins = {
  [id: string]: Plugin
}

/**
 * Type definition of the entry point for a Hawtio plugin.
 */
export type HawtioPlugin = () => void

export interface HawtioRemote extends ImportRemoteOptions {
  pluginEntry?: string
}

const DEFAULT_PLUGIN_ENTRY = 'plugin'

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
  async bootstrap() {
    log.info('Bootstrapping Hawtio...')
    await this.loadPlugins()
    log.info('Bootstrapped Hawtio')
  }

  /**
   * Downloads plugins from any configured URLs and load them.
   * It is invoked at Hawtio's bootstrapping.
   *
   * This plugin mechanism is implemented based on Webpack Module Federation.
   * https://module-federation.github.io/
   */
  private async loadPlugins() {
    if (this.urls.length === 0) {
      log.info('No URLs provided to load external plugins')
      return
    }

    const numBefore = Object.keys(this.plugins).length
    log.info(numBefore, 'plugins before loading:', { ...this.plugins })

    // Load external plugins from all URLs
    await Promise.all(this.urls.map(this.loadExternalPlugins))

    const numAfter = Object.keys(this.plugins).length
    log.info(numAfter, 'plugins after loaded:', this.plugins)

    // Notify plugins update
    if (numBefore !== numAfter) {
      log.debug('Notify plugins update')
      eventService.pluginsUpdated()
    }
  }

  /**
   * Loads external plugins from the given URL. The URL endpoint is expected to
   * return an array of HawtioRemote objects.
   */
  private async loadExternalPlugins(url: string) {
    log.debug('Trying url:', url)
    try {
      const res = await fetch(url)
      if (!res.ok) {
        log.error('Failed to fetch url:', url, '-', res.status, res.statusText)
        return
      }

      const remotes = (await res.json()) as HawtioRemote[]
      log.debug('Loaded remotes from url:', url, '=', remotes)

      // Load plugins
      await Promise.all(
        remotes.map(async remote => {
          log.debug('Loading remote', remote)
          try {
            const plugin = await importRemote<{ [entry: string]: HawtioPlugin }>(remote)
            const entryFn = plugin[remote.pluginEntry || DEFAULT_PLUGIN_ENTRY]
            if (!entryFn) {
              throw new Error(`Plugin entry not found: ${remote.pluginEntry || DEFAULT_PLUGIN_ENTRY}`)
            }
            entryFn()
            log.debug('Loaded remote', remote)
          } catch (err) {
            log.error('Error loading remote:', remote, '-', err)
          }
        }),
      )
    } catch (err) {
      log.error('Error fetching url:', url, '-', err)
    }
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
