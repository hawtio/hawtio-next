import { hawtio } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import { workspace } from '@hawtiosrc/plugins/shared'
import help from './help.md'
import { Jmx } from './Jmx'

export const jmx = () => {
  hawtio.addPlugin({
    id: 'jmx',
    title: 'JMX',
    path: 'jmx',
    component: Jmx,
    isActive: async () => workspace.hasMBeans(),
  })
  helpRegistry.add('jmx', 'JMX', help, 12)
}
