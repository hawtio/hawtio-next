import { userService } from '@hawtiosrc/auth'
import { importRemote, ImportRemoteOptions } from '@module-federation/utilities'
import $ from 'jquery'
import { configManager } from './config-manager'
import { eventService } from './event-service'
import { log } from './globals'

/**
 * Components to be added to the header navbar
 * Can define either a single component type or
 * a component with a universal property.
 *
 * By default, components will only be displayed
 * if the plugin UI is also visible. However, setting
 * universal to 'true' will ensure the component
 * remains displayed regardless of which plugin is
 * given focus.
 */
export interface UniversalHeaderItem {
  /**
   * The component that should be populated as
   * a dropdown item on the header bar.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>

  /**
   * Should components remain visible on header even when
   * the plugin is not being displayed.
   */
  universal: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HeaderItem = React.ComponentType<any> | UniversalHeaderItem

export function isUniversalHeaderItem(item: HeaderItem): item is UniversalHeaderItem {
  return 'component' in item && 'universal' in item && typeof item.universal === 'boolean'
}

/**
 * Internal representation of a Hawtio plugin.
 */
export interface Plugin {
  /**
   * Mandatory, unique plugin identifier
   */
  id: string

  /**
   * Title to be displayed in left PageSidebar
   */
  title?: string

  /**
   * Path for plugin's main component. Optional if the plugin only contributes header elements for example
   */
  path?: string

  /**
   * The order to be shown in the Hawtio sidebar.
   *
   * This only controls presentation and doesn't change the order of plugin to
   * be loaded.
   *
   * If it's not specified, it defaults to `100`. `0` ~ `30` are reserved for
   * the builtin plugins.
   */
  order?: number

  /**
   * If this plugin provides a login form component
   */
  isLogin?: boolean

  /**
   * Plugins main component to be displayed
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: React.ComponentType<any>

  headerItems?: HeaderItem[]

  /**
   * Returns if this plugin should be activated.
   * This method needs to return a promise as the process of resolving if a plugin
   * should be activated may require information collected asynchronously such as
   * the existence of some MBeans, etc.
   */
  isActive: () => Promise<boolean>
}

const DEFAULT_PLUGIN_ORDER = 100

/**
 * A collection of internal Hawtio plugins with IDs as keys.
 */
type Plugins = Record<string, Plugin>

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

  /**
   * Sets the base path of the Hawtio console.
   * If the given path includes trailing '/', it will be trimmed.
   */
  setBasePath(path: string) {
    if (path.length > 1 && path.endsWith('/')) {
      // Remove trailing '/'
      this.basePath = path.slice(0, -1)
    } else {
      this.basePath = path
    }
  }

  /**
   * Returns the base path of the Hawtio console without trailing '/'.
   */
  getBasePath(): string | undefined {
    if (!this.basePath) {
      const basePath = this.documentBase()
      log.info('Base path from html head:', basePath)
      if (basePath && basePath.length > 1 && basePath.endsWith('/')) {
        // Remove trailing '/'
        this.basePath = basePath.slice(0, -1)
      } else {
        this.basePath = basePath
      }
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

    // Load plugins
    await this.loadPlugins()

    // Apply branding
    // Branding should be applied after loading plugins as plugins may customise hawtconfig.
    const brandingApplied = await configManager.applyBranding()
    log.info('Branding applied:', brandingApplied)

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
   *
   * There are two types of plugin: normal plugin and login plugin.
   * If it's normal, it's only resolved when the user is already logged in.
   * If it's login, it's only resolved when the user is not logged in yet, and thus
   * can only affects the login page.
   *
   * Therefore, this method depends on the login status provided by the `userService`.
   */
  async resolvePlugins(): Promise<Plugin[]> {
    const userLoggedIn = await userService.isLogin()

    log.debug('Resolve plugins: login =', userLoggedIn)

    const resolved: Plugin[] = []
    // load plugins sequentially to maintain the order
    for (const plugin of this.getPlugins()) {
      log.debug('Resolve plugin:', plugin.id)

      if ((userLoggedIn && plugin.isLogin) || (!userLoggedIn && !plugin.isLogin)) {
        continue
      }

      if (await plugin.isActive()) {
        resolved.push(plugin)
      }
    }

    log.debug('Resolved plugins:', resolved)

    // Sort plugins for presentation
    resolved.sort((a, b) => (a.order ?? DEFAULT_PLUGIN_ORDER) - (b.order ?? DEFAULT_PLUGIN_ORDER))

    return resolved
  }
}

/**
 * Hawtio core singleton instance.
 */
export const hawtio = new HawtioCore()
