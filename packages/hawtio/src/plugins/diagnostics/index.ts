import { hawtio, type HawtioPlugin } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import { pluginId, pluginPath } from './globals'
import help from './help.md'
import { flightRecorderService } from './flight-recorder-service'

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
        isActive: async () => Boolean(flightRecorderService.getFlightRecoderMBean())
      }
    })
  })

  helpRegistry.add(pluginId, 'Diagnostics', help, order)
}
