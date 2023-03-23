import { hawtio, HawtioPlugin } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import { workspace } from '@hawtiosrc/plugins/shared'
import { pluginPath } from './globals'
import help from './help.md'
import { Jmx } from './Jmx'

export const jmx: HawtioPlugin = () => {
  hawtio.addPlugin({
    id: 'jmx',
    title: 'JMX',
    path: pluginPath,
    component: Jmx,
    isActive: async () => workspace.hasMBeans(),
  })
  helpRegistry.add('jmx', 'JMX', help, 12)
}
