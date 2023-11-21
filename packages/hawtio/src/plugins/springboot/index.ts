import { hawtio, HawtioPlugin } from '@hawtiosrc/core'

import { helpRegistry } from '@hawtiosrc/help'
import { SpringBoot } from '@hawtiosrc/plugins/springboot/SpringBoot'
import { pluginId, pluginPath } from './globals'
import help from './help.md'
import { isActive } from './springboot-service'

const order = 17

export const springboot: HawtioPlugin = () => {
  hawtio.addPlugin({
    id: pluginId,
    title: 'Spring Boot',
    path: pluginPath,
    order,
    component: SpringBoot,
    isActive,
  })
  helpRegistry.add(pluginId, 'Spring Boot', help, order)
}
