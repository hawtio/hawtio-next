import { hawtio, HawtioPlugin } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import { pluginId, pluginPath } from './globals'
import help from './help.md'
import { Quartz } from './Quartz'
import { quartzService } from './quartz-service'

const order = 15

export const quartz: HawtioPlugin = () => {
  hawtio.addPlugin({
    id: pluginId,
    title: 'Quartz',
    path: pluginPath,
    order,
    component: Quartz,
    isActive: () => quartzService.isActive(),
  })

  helpRegistry.add(pluginId, 'Quartz', help, order)
}
