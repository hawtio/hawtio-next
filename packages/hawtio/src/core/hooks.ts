import { configManager, eventService, EVENT_PLUGINS_UPDATED, Hawtconfig, hawtio, Plugin } from '@hawtiosrc/core'
import { useEffect, useState } from 'react'
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
      // Filter plugins by hawtconfig.json
      const enabledPlugins = await configManager.filterEnabledPlugins(activePlugins)
      setPlugins(enabledPlugins)
      setPluginsLoaded(true)
    }
    loadPlugins()

    // Reload plugins when they are updated elsewhere
    eventService.onPluginsUpdated(loadPlugins)
    return () => eventService.removeListener(EVENT_PLUGINS_UPDATED, loadPlugins)
  }, [])

  return { plugins, pluginsLoaded }
}

/**
 * Custom React hook for using hawtconfig.json.
 */
export function useHawtconfig() {
  const [hawtconfig, setHawtconfig] = useState<Hawtconfig>({})
  const [hawtconfigLoaded, setHawtconfigLoaded] = useState(false)

  useEffect(() => {
    const loadHawtconfig = async () => {
      setHawtconfig(await configManager.getHawtconfig())
      setHawtconfigLoaded(true)
    }
    loadHawtconfig()
  }, [])

  return { hawtconfig, hawtconfigLoaded }
}
