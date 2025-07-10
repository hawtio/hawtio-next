import { hawtio, type HawtioPlugin } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import { workspace } from '@hawtiosrc/plugins/shared'
import { preferencesRegistry } from '@hawtiosrc/preferences'
import { pluginPath } from './globals'
import help from './help.md'

const order = 13

export const jmx: HawtioPlugin = () => {
  import('./ui').then(m => {
    hawtio.addPlugin({
      id: 'jmx',
      title: 'JMX',
      path: pluginPath,
      order,
      component: m.Jmx,
      isActive: async () => workspace.hasMBeans(),
    })
    preferencesRegistry.add('jmx', 'JMX', m.JmxPreferences, order)
  })
  helpRegistry.add('jmx', 'JMX', help, order)
}
