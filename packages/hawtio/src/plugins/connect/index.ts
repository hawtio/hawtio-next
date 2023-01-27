import { hawtio } from '@hawtio/core'
import { helpRegistry } from '@hawtio/help/registry'
import { preferencesRegistry } from '@hawtio/preferences/registry'
import { Connect } from './Connect'
import { ConnectPreferences } from './ConnectPreferences'
import help from './help.md'
import { jolokiaService } from './jolokia-service'

export const connect = () => {
  hawtio.addPlugin({
    id: 'connect',
    title: 'Connect',
    path: '/connect',
    component: Connect,
    isActive: async () => {
      const jolokiaUrl = await jolokiaService.getJolokiaUrl()
      return jolokiaUrl === null
    },
  })
  helpRegistry.add('connect', 'Connect', help, 11)
  preferencesRegistry.add('connect', 'Connect', ConnectPreferences, 11)
}
