
export interface HawtioPlugin {
  name: string
  context: string
  domain: string
  scripts: string[]
}

type HawtioPlugins = {
  [key: string]: HawtioPlugin
}

const log = console.log

/**
 * Plugin loader and discovery mechanism for Hawtio
 */
class PluginLoader {

  /**
   * List of URLs that the plugin loader will try and discover
   * plugins from
   */
  private urls: string[] = [];

  /**
   * Holds all of the Hawtio plugins that need to be bootstrapped
   */
  private plugins: string[] = [];

  /**
   * Add an angular module to the list of modules to bootstrap
   */
  addPlugin(plugin: string): PluginLoader {
    log("Adding plugin:", plugin)
    this.plugins.push(plugin)
    return this
  };

  /**
   * Add a URL for discovering plugins.
   */
  addUrl(url: string): PluginLoader {
    log("Adding URL:", url)
    this.urls.push(url)
    return this
  };

  /**
   * Downloads plugins at any configured URLs and bootstraps the app.
   *
   * It is invoked from HawtioCore's bootstrapping.
   */
  loadPlugins(callback: () => void): void {
    callback()
  }

}

const pluginLoader = new PluginLoader()

export default pluginLoader
