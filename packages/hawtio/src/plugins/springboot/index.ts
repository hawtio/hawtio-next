import { hawtio, HawtioPlugin } from '@hawtiosrc/core'

import { helpRegistry } from '@hawtiosrc/help'
import { pluginId, pluginPath } from './globals'
import help from './help.md'
import { springbootService } from './springboot-service'

const order = 17

export const springboot: HawtioPlugin = () => {
  import("./ui").then(m => {
    hawtio.addPlugin({
      id: pluginId,
      title: 'Spring Boot',
      path: pluginPath,
      order,
      component: m.SpringBoot,
      isActive: springbootService.isActive,
    })
  })
  helpRegistry.add(pluginId, 'Spring Boot', help, order)
}
