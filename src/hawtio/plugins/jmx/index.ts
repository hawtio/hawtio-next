import { hawtio } from '@hawtio/core'
import { helpRegistry } from '@hawtio/help/registry'

import help from './help.md'
import { Jmx } from './Jmx'
import { workspace } from './workspace'

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
