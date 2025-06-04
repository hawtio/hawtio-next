import { Plugin } from './core'
import { Logger } from './logging'

const log = Logger.get('hawtio-core-config')

export const DEFAULT_APP_NAME = 'Hawtio Management Console'
export const DEFAULT_LOGIN_TITLE = 'Log in to your account'

/**
 * The single user-customisable entrypoint for the Hawtio console configurations.
 */
export type Hawtconfig = {
  /**
   * Configuration for branding & styles.
   */
  branding?: BrandingConfig

  /**
   * Configuration for the placement and structure of the UI
   */
  appearance?: AppearanceConfig

  /**
   * Configuration for the built-in login page.
   */
  login?: LoginConfig

  /**
   * Configuration for the About modal.
   */
  about?: AboutConfig

  /**
   * The user can explicitly disable plugins by specifying the plugin route paths.
   *
   * This option can be used if some of the built-in plugins are not desirable
   * for the custom installation of Hawtio console.
   */
  disabledRoutes?: DisabledRoutes

  /**
   * Configuration for JMX plugin.
   */
  jmx?: JmxConfig

  /**
   * Configuration for Hawtio Online.
   */
  online?: OnlineConfig
}

/**
 * Branding configuration type.
 */
export type BrandingConfig = {
  appName?: string
  showAppName?: boolean
  appLogoUrl?: string
  css?: string
  favicon?: string
}

/**
 * Appearance configuration type.
 */
export type AppearanceConfig = {
  // Whether to display the header bar (default: true)
  showHeader?: boolean

  // Whether to display the brand logo on the header bar (default: true)
  showBrand?: boolean

  // Whether to display the user header dropdown on the header bar (default: true)
  showUserHeader?: boolean

  // Whether to display the sidebar (default: true)
  showSideBar?: boolean
}

/**
 * Login configuration type.
 */
export type LoginConfig = {
  title?: string
  description?: string
  links?: LoginLink[]
}

export type LoginLink = {
  url: string
  text: string
}

/**
 * About configuration type.
 */
export type AboutConfig = {
  title?: string
  description?: string
  imgSrc?: string
  backgroundImgSrc?: string
  productInfo?: AboutProductInfo[]
  copyright?: string
}

export type AboutProductInfo = {
  name: string
  value: string
}

export type DisabledRoutes = string[]

/**
 * JMX configuration type.
 */
export type JmxConfig = {
  /**
   * This option can either disable workspace completely by setting `false`, or
   * specify an array of MBean paths in the form of
   * `<domain>/<prop1>=<value1>,<prop2>=<value2>,...`
   * to fine-tune which MBeans to load into workspace.
   *
   * Note that disabling workspace should also deactivate all the plugins that
   * depend on MBeans provided by workspace.
   *
   * @see https://github.com/hawtio/hawtio-next/issues/421
   */
  workspace?: boolean | string[]
}

/**
 * Hawtio Online configuration type.
 */
export type OnlineConfig = {
  /**
   * Selector for OpenShift projects or Kubernetes namespaces.
   *
   * @see https://github.com/hawtio/hawtio-online/issues/64
   */
  projectSelector?: string
}

export const HAWTCONFIG_JSON = 'hawtconfig.json'

class ConfigManager {
  private config?: Promise<Hawtconfig>

  private cfg: Record<string, { ready: boolean, group: string }> = {}
  private listeners: ((config: Record<string, { ready: boolean, group: string }>) => void)[] = []

  reset() {
    this.config = undefined
  }

  setHawtconfig(config: Hawtconfig) {
    this.config = Promise.resolve(config)
  }

  getHawtconfig(): Promise<Hawtconfig> {
    if (this.config) {
      return this.config
    }

    this.config = this.loadConfig()
    return this.config
  }

  private async loadConfig(): Promise<Hawtconfig> {
    log.info('Loading', HAWTCONFIG_JSON)

    this.setConfigItem("Loading " + HAWTCONFIG_JSON, false, "config")
    try {
      const res = await fetch(HAWTCONFIG_JSON)
      if (!res.ok) {
        log.error('Failed to fetch', HAWTCONFIG_JSON, '-', res.status, res.statusText)
        return {}
      }
      this.setConfigItem("Loading " + HAWTCONFIG_JSON, true, "config")

      const config = await res.json()
      log.debug(HAWTCONFIG_JSON, '=', config)
      log.info('Loaded', HAWTCONFIG_JSON)
      return config
    } catch (err) {
      log.error('Error fetching', HAWTCONFIG_JSON, '-', err)
      return {}
    }
  }

  async configure(configurer: (config: Hawtconfig) => void) {
    const config = await this.getHawtconfig()
    configurer(config)
  }

  async applyBranding(): Promise<boolean> {
    const { branding } = await this.getHawtconfig()
    if (!branding) {
      return false
    }

    log.info('Apply branding', branding)
    this.setConfigItem("Applying branding", false, "config")
    let applied = false
    if (branding.appName) {
      log.info('Updating title -', branding.appName)
      document.title = branding.appName
      applied = true
    }
    if (branding.css) {
      // Branding css should be pushed to last to override the builtin PatternFly styles
      this.updateHref('#branding', branding.css, true)
      applied = true
    }
    if (branding.favicon) {
      this.updateHref('#favicon', branding.favicon)
      applied = true
    }
    this.setConfigItem("Applying branding", true, "config")
    return applied
  }

  private updateHref(id: string, path: string, moveToLast: boolean = false): void {
    log.info('Updating href for', id, '-', path, moveToLast)
    const elm = document.querySelector(id) as HTMLInputElement
    if (!elm) {
      return
    }
    if ('disabled' in elm) {
      elm.disabled = true
    }
    elm.setAttribute('href', path)
    if (moveToLast) {
      elm.remove()
      document.querySelector('head')?.append(elm)
    }
    if ('disabled' in elm) {
      elm.disabled = false
    }
  }

  async isRouteEnabled(path: string): Promise<boolean> {
    const { disabledRoutes } = await this.getHawtconfig()
    return !disabledRoutes || !disabledRoutes.includes(path)
  }

  async filterEnabledPlugins(plugins: Plugin[]): Promise<Plugin[]> {
    const enabledPlugins: Plugin[] = []
    for (const plugin of plugins) {
      if ((plugin.path == null && (await plugin.isActive())) || (await this.isRouteEnabled(plugin.path!))) {
        enabledPlugins.push(plugin)
      } else {
        log.debug(`Plugin "${plugin.id}" disabled by hawtconfig.json`)
      }
    }
    return enabledPlugins
  }

  async addProductInfo(name: string, value: string) {
    const config = await this.getHawtconfig()
    if (!config.about) {
      config.about = {}
    }
    if (!config.about.productInfo) {
      config.about.productInfo = []
    }
    config.about.productInfo.push({ name, value })
  }

  getConfig(): Record<string, { ready: boolean, group: string }> {
    return this.cfg
  }

  addListener(f: (config: Record<string, { ready: boolean, group: string }>) => void) {
    this.listeners.push(f)
  }

  removeListener(f: (config: Record<string, { ready: boolean, group: string }>) => void) {
    this.listeners.splice(this.listeners.indexOf(f), 1)
  }

  setConfigItem(item: string, ready: boolean, group: string) {
    this.cfg[item] = { ready, group }
    setTimeout(() => {
      for (const l of this.listeners) {
        l(this.cfg)
      }
    }, 0)
  }

  async ready(): Promise<boolean> {
    return new Promise((resolve, _reject) => {
      const h: NodeJS.Timeout = setInterval(() => {
        const result = Object.values(this.cfg!).find(v => !v.ready) == undefined
        if (result) {
          resolve(true)
          clearInterval(h)
        }
      }, 100)
    })
  }
}

export const configManager = new ConfigManager()
