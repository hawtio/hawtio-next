import { hawtio, HawtioPlugin } from '@hawtiosrc/core'

import { pluginId, pluginPath } from './globals'
import { workspace } from '@hawtiosrc/plugins'
import { helpRegistry } from '@hawtiosrc/help'
import help from './help.md'
import {Springboot} from "@hawtiosrc/plugins/springboot/Springboot"

export const springboot: HawtioPlugin = () => {
  hawtio.addPlugin({
    id: pluginId,
    title: 'Springboot',
    path: pluginPath,
    component: Springboot,
    isActive: async () => workspace.hasMBeans(),
  })
  helpRegistry.add(pluginId, 'Runtime', help, 16)
}
