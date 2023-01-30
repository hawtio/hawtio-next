import { hawtio } from '@hawtio/core'
import { helpRegistry } from '@hawtio/help/registry'
import { workspace } from '@hawtio/plugins/shared'
import help from './help.md'
import { Jmx } from './Jmx'

export const jmx = () => {
  hawtio.addPlugin({
    id: 'jmx',
    title: 'JMX',
    path: '/jmx',
    component: Jmx,
    isActive: async () => workspace.hasMBeans(),
  })
  helpRegistry.add('jmx', 'JMX', help, 12)
}
