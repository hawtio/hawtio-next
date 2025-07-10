import { hawtio, type HawtioPlugin } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import { preferencesRegistry } from '@hawtiosrc/preferences/registry'
import { pluginId, pluginPath } from './globals'
import help from './help.md'
import { logsService } from './logs-service'

const order = 14

export const logs: HawtioPlugin = () => {
  hawtio.addDeferredPlugin(pluginId, async () => {
    return import('./ui').then(m => {
      // To avoid conflicts in name with 'Console Logs'
      preferencesRegistry.add(pluginId, 'Server Logs', m.LogsPreferences, order)
      return {
        id: pluginId,
        title: 'Logs',
        path: pluginPath,
        order,
        component: m.Logs,
        isActive: () => logsService.isActive(),
      }
    })
  })

  helpRegistry.add(pluginId, 'Logs', help, order)
}
