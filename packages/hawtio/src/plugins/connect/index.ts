import { hawtio, HawtioPlugin } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import { preferencesRegistry } from '@hawtiosrc/preferences/registry'
import { Connect } from './Connect'
import { ConnectPreferences } from './ConnectPreferences'
import help from './help.md'
import { isActive, registerUserHooks } from './init'

const order = 11

export const connect: HawtioPlugin = () => {
  registerUserHooks()
  hawtio.addPlugin({
    id: 'connect',
    title: 'Connect',
    path: 'connect',
    order,
    component: Connect,
    isActive,
  })
  helpRegistry.add('connect', 'Connect', help, order)
  preferencesRegistry.add('connect', 'Connect', ConnectPreferences, order)
}

export * from './connections'
