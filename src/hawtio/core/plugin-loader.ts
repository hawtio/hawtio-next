export interface Plugin {
  id: string
  title: string
  path: string
  component: React.ComponentType<unknown>
  isActive?: () => boolean
}

type Plugins = {
  [id: string]: Plugin
}

const log = {
  info: console.log,
  debug: console.debug,
}

/**
 * Plugin loader and discovery mechanism.
 */
class PluginLoader {

  /**
   * List of URLs that the plugin loader will try and discover plugins from.
   */
  private urls: string[] = [];

  /**
   * Holds all of the Hawtio plugins that need to be bootstrapped.
   */
  private plugins: Plugins = {};

  /**
   * Add an angular module to the list of modules to bootstrap.
   */
  addPlugin(plugin: Plugin): PluginLoader {
    log.info("Add plugin:", plugin.id)
    if (this.plugins[plugin.id]) {
      throw new Error(`Plugin "${plugin.id}" already exists`)
    }
    this.plugins[plugin.id] = plugin
    return this
  }

  /**
   * Add a URL for discovering plugins.
   */
  addUrl(url: string): PluginLoader {
    log.info("Add URL:", url)
    this.urls.push(url)
    return this
  }

  /**
   * Downloads plugins at any configured URLs and bootstraps the app.
   *
   * It is invoked from Hawtio's bootstrapping.
   */
  loadPlugins(callback: (plugins: Plugins) => void): void {
    log.info("Bootstrapping Hawtio...")
    callback(this.plugins)
  }

  getPlugins(): Plugin[] {
    return Object.values(this.plugins)
  }

  defaultPlugin(): Plugin | null {
    return this.getPlugins().filter(plugin => plugin.isActive?.() !== false)[0] || null
  }

}

/**
 * PluginLoader singleton instance.
 */
export const hawtio = new PluginLoader()
