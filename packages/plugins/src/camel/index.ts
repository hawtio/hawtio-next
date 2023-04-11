import {
  hawtio,
  HawtioPlugin,
  helpRegistry,
  preferencesRegistry,
  treeProcessorRegistry,
  workspace,
} from '@hawtio/react'
import { Camel } from './Camel'
import { CamelPreferences } from './CamelPreferences'
import { jmxDomain, pluginPath } from './globals'
import help from './help.md'
import { camelTreeProcessor } from './tree-processor'

export const camel: HawtioPlugin = () => {
  hawtio.addPlugin({
    id: 'camel',
    title: 'Camel',
    path: pluginPath,
    component: Camel,
    isActive: async () => {
      return workspace.treeContainsDomainAndProperties(jmxDomain)
    },
  })

  treeProcessorRegistry.add('camel', camelTreeProcessor)
  helpRegistry.add('camel', 'Camel', help, 13)
  preferencesRegistry.add('camel', 'Camel', CamelPreferences, 13)
}
