import React from 'react'
import { userService } from '@hawtiosrc/auth'
import { importRemote, ImportRemoteOptions } from '@module-federation/utilities'
import { configManager, TaskState } from './config-manager'
import { eventService } from './event-service'
import { log } from './globals'

const DEFAULT_REMOTE_ENTRY_FILE = 'remoteEntry.js'

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

/**
 * Extension of Module Federation {@link ImportRemoteOptions} for single federated module.
 */
export interface HawtioRemote extends ImportRemoteOptions {
  pluginEntry?: string
}

const DEFAULT_PLUGIN_ENTRY = 'plugin'

const HAWTIO_DISABLE_THEME_LISTENER = 'hawtio.disableThemeListener'

const PATTERNFLY_THEME_CLASS = 'pf-v5-theme-dark'

/**
 * Hawtio core service.
 *
 * This service provides the following functionalities:
 * - Base path provisioning
 * - Plugin loader and discovery mechanism
 * - Bootstrapping the application
 */
export class HawtioCore {
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
   * The Window Theme Listener callback function
   */
  private windowThemeListener = () => {
    this.updateFromTheme()
  }

  /**
   * Flag set once the window theme listener has been added
   */
  private windowListenerAdded = false

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

  /**
   * Returns the base URL specified in html/head/base element, href attribute. It should end with trailing '/'.
   * Specified base affects how `fetch()` global function works.
   * @private
   */
  private documentBase(): string | undefined {
    const base = document.querySelector('head base')
    if (base) {
      return base.getAttribute('href') ?? undefined
    }
    return undefined
  }

  /**
   * Adds a module to the list of modules to bootstrap.
   */
  addPlugin(plugin: Plugin): HawtioCore {
    log.info('Add plugin:', plugin.id)
    configManager.initItem('Registering plugin: ' + plugin.id, TaskState.started, 'plugins')
    if (this.plugins[plugin.id]) {
      throw new Error(`Plugin "${plugin.id}" already exists`)
    }
    this.plugins[plugin.id] = plugin
    setTimeout(() => {
      configManager.initItem('Registering plugin: ' + plugin.id, TaskState.finished, 'plugins')
    }, 0)
    return this
  }

  /**
   * Adds a URL for discovering plugins. Single URL defines an endpoint that returns an array of modules/plugins
   * defined by {@link HawtioRemote} type.
   *
   * @param url An URL to fetch the plugin information from. When the URL is relative, it it's using `document.baseURI`
   *  as the base.
   */
  addUrl(url: string): HawtioCore {
    if (URL.canParse(url)) {
      // assume it's absolute URL
    } else {
      // assume it's relative URL
      url = new URL(url, document.baseURI).href
    }
    log.info('Add URL:', url)
    this.urls.push(url)
    return this
  }

  /**
   * Bootstraps Hawtio. This method needs to be called by all applications that are bundled with `webpack` (or
   * similar web bundler).
   *
   * This method returns a Promise. When resolved we can take the `<Hawtio>` React/Patternfly component
   * and render it in React root node.
   */
  async bootstrap() {
    log.info('Bootstrapping Hawtio...')

    // Load configuration to be used by all other services (login service, jolokia service, session service,
    // user service, ...)
    await configManager.initialize()

    // Load plugins
    await this.loadPlugins()

    // Apply branding
    // Branding should be applied after loading plugins as plugins may customise hawtconfig.
    const brandingApplied = await configManager.applyBranding()
    log.info('Branding applied:', brandingApplied)

    log.info('Bootstrapped Hawtio')
    configManager.initItem('Finish', TaskState.finished, 'finish')

    // return a promise that waits for configManager to finish all its initialization items
    return configManager.ready().then(() => {
      log.debug('configManager.ready() resolved')
      return true
    })
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
      configManager.initItem('Loading plugins descriptor from URL ' + url, TaskState.started, 'plugins')
      const res = await fetch(url)
      if (!res.ok) {
        configManager.initItem('Loading plugins descriptor from URL ' + url, TaskState.error, 'plugins')
        log.error('Failed to fetch url:', url, '-', res.status, res.statusText)
        return
      }

      const remotes = (await res.json()) as HawtioRemote[]
      log.info('Loaded remotes from url:', url, '=', remotes)
      configManager.initItem('Loading plugins descriptor from URL ' + url, TaskState.finished, 'plugins')

      // Load plugins
      await Promise.all(
        remotes.map(async remote => {
          let url: string
          if (typeof remote.url === 'function') {
            url = await remote.url()
          } else {
            url = remote.url
          }
          if (!url.endsWith('/')) {
            url += '/'
          }
          if (URL.canParse(url)) {
            // should be absolute URL
            url += remote.remoteEntryFileName ?? DEFAULT_REMOTE_ENTRY_FILE
          } else {
            url = new URL(url + (remote.remoteEntryFileName ?? DEFAULT_REMOTE_ENTRY_FILE), document.baseURI).href
          }
          log.info('Loading remote', remote)
          try {
            configManager.initItem('Importing plugin from: ' + url, TaskState.started, 'plugins')
            // call @module-federation/utilities method which helps us to deal with
            // webpack's Module Federation (like container.init(__webpack_share_scopes__['default']) call)
            const plugin = await importRemote<{ [entry: string]: HawtioPlugin }>(remote)
            const entryFn = plugin[remote.pluginEntry || DEFAULT_PLUGIN_ENTRY]
            if (!entryFn) {
              throw new Error(`Plugin entry not found: ${remote.pluginEntry || DEFAULT_PLUGIN_ENTRY}`)
            }
            entryFn()
            configManager.initItem('Importing plugin from: ' + url, TaskState.finished, 'plugins')
            // configManager.initItem('Importing plugin from: ' + remote.url, true, "plugins")
            log.info('Loaded remote', remote)
          } catch (err) {
            configManager.initItem('Importing plugin from: ' + url, TaskState.error, 'plugins')
            log.error('Error loading remote:', remote, '-', err)
          }
        }),
      )
    } catch (err) {
      configManager.initItem('Loading plugins descriptor from URL ' + url, TaskState.error, 'plugins')
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

  // Actual window theme query
  private themeList() {
    return window.matchMedia('(prefers-color-scheme: dark)')
  }

  /**
   * Detect what theme the browser has been set to and
   * return 'dark' | 'light'
   */
  private windowTheme() {
    return this.themeList().matches ? 'dark' : 'light'
  }

  /**
   * Update the document root with the patternfly dark class
   * see https://www.patternfly.org/developer-resources/dark-theme-handbook
   */
  private updateFromTheme() {
    if (this.windowTheme() === 'dark') {
      document.documentElement.classList.add(PATTERNFLY_THEME_CLASS)
    } else {
      document.documentElement.classList.remove(PATTERNFLY_THEME_CLASS)
    }
  }

  /**
   * Adds an event listener to the window theme to update
   * css values in the event of a change in theme
   */
  addWindowThemeListener() {
    if (this.windowListenerAdded) {
      // Avoid checking storage an trying to re-add if already added
      return
    }

    const disableListener = localStorage.getItem(HAWTIO_DISABLE_THEME_LISTENER) ?? 'false'
    if (disableListener === 'true') {
      return // Do not enable theme listener
    }

    // Initial update when application is loaded
    this.updateFromTheme()

    // Subsequent attempts to change the theme
    this.themeList().addEventListener('change', this.windowThemeListener)
    this.windowListenerAdded = true
  }

  /**
   * Removes the event listener to the window theme
   */
  removeWindowThemeListener() {
    this.themeList().removeEventListener('change', this.windowThemeListener)
    this.windowListenerAdded = false
  }
}

/**
 * Hawtio core singleton instance.
 */
export const hawtio = new HawtioCore()
