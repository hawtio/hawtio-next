import { hawtio, HawtioPlugin } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import { preferencesRegistry } from '@hawtiosrc/preferences/registry'
import { Connect } from './Connect'
import { ConnectPreferences } from './ConnectPreferences'
import { pluginId, pluginPath, pluginTitle } from './globals'
import help from './help.md'
import { isActive, registerUserHooks } from './init'

const order = 11

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
  helpRegistry.add(pluginId, pluginTitle, help, order)
  preferencesRegistry.add(pluginId, pluginTitle, ConnectPreferences, order)
}

export * from './connections'
