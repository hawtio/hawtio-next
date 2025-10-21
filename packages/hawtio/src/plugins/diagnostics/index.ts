import { hawtio, type HawtioPlugin } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import { pluginId, pluginPath } from './globals'
import help from './help.md'
import { flightRecorderService } from './flight-recorder-service'
import { connectService } from '../shared'

const order = 19

export const diagnostics: HawtioPlugin = () => {
  hawtio.addDeferredPlugin(pluginId, async () => {
    return import('./ui').then(m => {
      return {
        id: pluginId,
        title: 'Diagnostics',
        path: pluginPath,
        order,
        component: m.Diagnostics,
        isActive: async () => {
          return (
            (await flightRecorderService.hasFlightRecorderMBean()) && connectService.getCurrentConnectionId() === null
          )
        },
      }
    })
  })

  helpRegistry.add(pluginId, 'Diagnostics', help, order)
}
