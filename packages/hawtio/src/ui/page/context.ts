import { configManager, hawtio, Plugin } from '@hawtio/core'
import { createContext, useEffect, useState } from 'react'
import { log } from './globals'

/**
 * Custom React hook for using Hawtio plugins.
 */
export function usePlugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loaded, setLoaded] = useState(false)

  log.debug('Plugins:', hawtio.getPlugins())

  useEffect(() => {
    const loadPlugins = async () => {
      const activePlugins = await hawtio.resolvePlugins()

      // Disable plugins from hawtconfig.json
      const enabledPlugins: Plugin[] = []
      for (const plugin of activePlugins) {
        if (await configManager.isRouteEnabled(plugin.path)) {
          enabledPlugins.push(plugin)
        } else {
          log.debug(`Plugin "${plugin.id}" disabled by hawtconfig.json`)
        }
      }

      setPlugins(enabledPlugins)
      setLoaded(true)
    }
    loadPlugins()
  }, [])

  return { plugins, loaded }
}

export type PageContext = {
  plugins: Plugin[]
  loaded: boolean
}

export const PageContext = createContext<PageContext>({
  plugins: [],
  loaded: false,
})
