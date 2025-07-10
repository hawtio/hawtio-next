import { hawtio, type HawtioPlugin } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import { preferencesRegistry } from '@hawtiosrc/preferences/registry'
import { pluginId, pluginPath } from './globals'
import help from './help.md'
import { logsService } from './logs-service'
import { LogsPreferences } from './LogsPreferences'

const order = 14

export const logs: HawtioPlugin = () => {
  import('./ui').then(m => {
    hawtio.addPlugin({
      id: pluginId,
      title: 'Logs',
      path: pluginPath,
      order,
      component: m.Logs,
      isActive: () => logsService.isActive(),
    })
    // To avoid conflicts in name with 'Console Logs'
    preferencesRegistry.add(pluginId, 'Server Logs', LogsPreferences, order)
  })

  helpRegistry.add(pluginId, 'Logs', help, order)
}
