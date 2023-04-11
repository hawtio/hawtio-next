import { hawtio, HawtioPlugin } from '__root__/core'
import { helpRegistry } from '__root__/help/registry'
import { workspace } from '__root__/plugins/shared'
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
