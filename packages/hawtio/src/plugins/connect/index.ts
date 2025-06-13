import { hawtio, HawtioPlugin, UniversalHeaderItem } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import { preferencesRegistry } from '@hawtiosrc/preferences/registry'
import { pluginId, pluginPath, pluginTitle, statusPluginId } from './globals'
import help from './help.md'
import { isActive, isConnectionStatusActive, registerUserHooks } from './init'

const order = 11

export const connect: HawtioPlugin = () => {
  registerUserHooks()

  import("./ui").then(m => {
    hawtio.addPlugin({
      id: pluginId,
      title: pluginTitle,
      path: pluginPath,
      order,
      component: m.Connect,
      isActive,
    })
    preferencesRegistry.add(pluginId, pluginTitle, m.ConnectPreferences, order)
    const connectStatusItem: UniversalHeaderItem = {
      component: m.ConnectionStatus,
      universal: true,
    }
    hawtio.addPlugin({
      id: statusPluginId,
      headerItems: [connectStatusItem],
      isActive: isConnectionStatusActive,
    })
  })
  helpRegistry.add(pluginId, pluginTitle, help, order)
}

export * from './connections'
