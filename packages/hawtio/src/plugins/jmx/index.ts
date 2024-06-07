import { hawtio, HawtioPlugin } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import { workspace } from '@hawtiosrc/plugins/shared'
import { preferencesRegistry } from '@hawtiosrc/preferences'
import { pluginPath } from './globals'
import help from './help.md'
import { Jmx } from './Jmx'
import { JmxPreferences } from './JmxPreferences'

const order = 13

export const jmx: HawtioPlugin = () => {
  hawtio.addPlugin({
    id: 'jmx',
    title: 'JMX',
    path: pluginPath,
    order,
    component: Jmx,
    isActive: async () => workspace.hasMBeans(),
  })
  helpRegistry.add('jmx', 'JMX', help, order)
  preferencesRegistry.add('jmx', 'JMX', JmxPreferences, order)
}
