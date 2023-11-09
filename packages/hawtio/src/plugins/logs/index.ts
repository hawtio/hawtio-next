import { hawtio, HawtioPlugin } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import { preferencesRegistry } from '@hawtiosrc/preferences/registry'
import { pluginId, pluginPath } from './globals'
import help from './help.md'
import { Logs } from './Logs'
import { logsService } from './logs-service'
import { LogsPreferences } from './LogsPreferences'

const order = 14

export const logs: HawtioPlugin = () => {
  hawtio.addPlugin({
    id: pluginId,
    title: 'Logs',
    path: pluginPath,
    order,
    component: Logs,
    isActive: () => logsService.isActive(),
  })

  helpRegistry.add(pluginId, 'Logs', help, order)
  // To avoid conflicts in name with 'Console Logs'
  preferencesRegistry.add(pluginId, 'Server Logs', LogsPreferences, order)
}
