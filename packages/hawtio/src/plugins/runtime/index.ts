import { hawtio, HawtioPlugin } from '@hawtiosrc/core'
import { Runtime } from './Runtime'
import { pluginId, pluginPath } from './globals'
import { workspace } from '@hawtiosrc/plugins'
import { helpRegistry } from '@hawtiosrc/help'
import help from './help.md'

export const runtime: HawtioPlugin = () => {
  hawtio.addPlugin({
    id: pluginId,
    title: 'Runtime',
    path: pluginPath,
    component: Runtime,
    isActive: async () => workspace.hasMBeans(),
  })
  helpRegistry.add(pluginId, 'Runtime', help, 16)
}
