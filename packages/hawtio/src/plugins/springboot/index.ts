import { hawtio, HawtioPlugin } from '@hawtiosrc/core'

import { pluginId, pluginPath } from './globals'
import { workspace } from '@hawtiosrc/plugins'
import { helpRegistry } from '@hawtiosrc/help'
import help from './help.md'
import { SpringBoot } from '@hawtiosrc/plugins/springboot/SpringBoot'

export const springboot: HawtioPlugin = () => {
  hawtio.addPlugin({
    id: pluginId,
    title: 'Spring Boot',
    path: pluginPath,
    component: SpringBoot,
    isActive: async () => workspace.treeContainsDomainAndProperties('org.springframework.boot'),
  })
  helpRegistry.add(pluginId, 'Spring Boot', help, 17)
}
