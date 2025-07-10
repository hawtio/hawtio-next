import { hawtio, type HawtioPlugin, type UniversalHeaderItem } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import { preferencesRegistry } from '@hawtiosrc/preferences/registry'
import { pluginId, pluginPath, pluginTitle, statusPluginId } from './globals'
import help from './help.md'
import { isActive, isConnectionStatusActive, registerUserHooks } from './init'

const order = 11

export const connect: HawtioPlugin = () => {
  registerUserHooks()

  hawtio.addDeferredPlugin(pluginId, async () => {
    return import('./ui').then(m => {
      preferencesRegistry.add(pluginId, pluginTitle, m.ConnectPreferences, order)
      return {
        id: pluginId,
        title: pluginTitle,
        path: pluginPath,
        order,
        component: m.Connect,
        isActive,
      }
    })
  })
  hawtio.addDeferredPlugin(statusPluginId, async () => {
    return import('./ui').then(m => {
      const connectStatusItem: UniversalHeaderItem = {
        component: m.ConnectionStatus,
        universal: true,
      }
      return {
        id: statusPluginId,
        headerItems: [connectStatusItem],
        isActive: isConnectionStatusActive,
      }
    })
  })
  helpRegistry.add(pluginId, pluginTitle, help, order)
}

export * from './connections'
