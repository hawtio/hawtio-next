import { hawtio, HawtioPlugin, UniversalHeaderItem } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import { preferencesRegistry } from '@hawtiosrc/preferences/registry'
import { Connect } from './Connect'
import { ConnectPreferences } from './ConnectPreferences'
import { pluginId, pluginPath, pluginTitle, statusPluginId } from './globals'
import help from './help.md'
import { isActive, isConnectionStatusActive, registerUserHooks } from './init'
import { ConnectionStatus } from '@hawtiosrc/plugins/connect/ConnectionStatus'

const order = 11

const connectStatusItem: UniversalHeaderItem = {
  component: ConnectionStatus,
  universal: true,
}

export const connect: HawtioPlugin = () => {
  registerUserHooks()
  hawtio.addPlugin({
    id: pluginId,
    title: pluginTitle,
    path: pluginPath,
    order,
    component: Connect,
    isActive,
  })
  hawtio.addPlugin({
    id: statusPluginId,
    headerItems: [connectStatusItem],
    isActive: isConnectionStatusActive,
  })
  helpRegistry.add(pluginId, pluginTitle, help, order)
  preferencesRegistry.add(pluginId, pluginTitle, ConnectPreferences, order)
}

export * from './connections'
