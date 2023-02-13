import { Branding, configManager, hawtio, Plugin } from '@hawtiosrc/core'
import { createContext, useEffect, useState } from 'react'
import { log } from './globals'

/**
 * Custom React hook for using Hawtio plugins.
 */
export function usePlugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [pluginsLoaded, setPluginsLoaded] = useState(false)

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
      setPluginsLoaded(true)
    }
    loadPlugins()
  }, [])

  return { plugins, pluginsLoaded }
}

/**
 * Custom React hook for using Hawtio branding.
 */
export function useBranding() {
  const [branding, setBranding] = useState<Branding>({})
  const [brandingLoaded, setBrandingLoaded] = useState(false)

  useEffect(() => {
    const loadBranding = async () => {
      const config = await configManager.getConfig()
      if (config.branding) {
        setBranding(config.branding)
      }
      setBrandingLoaded(true)
    }
    loadBranding()
  }, [])

  return { branding, brandingLoaded }
}

export type PageContext = {
  plugins: Plugin[]
  pluginsLoaded: boolean
}

export const PageContext = createContext<PageContext>({
  plugins: [],
  pluginsLoaded: false,
})
