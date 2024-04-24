import { hawtio, HawtioPlugin } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import { treeProcessorRegistry, workspace } from '@hawtiosrc/plugins/shared'
import { preferencesRegistry } from '@hawtiosrc/preferences/registry'
import { Camel } from './Camel'
import { getCamelVersions } from './camel-service'
import { CamelPreferences } from './CamelPreferences'
import { jmxDomain, log, pluginPath } from './globals'
import help from './help.md'
import { camelTreeProcessor } from './tree-processor'

const order = 12

export const camel: HawtioPlugin = () => {
  hawtio.addPlugin({
    id: 'camel',
    title: 'Camel',
    path: pluginPath,
    order,
    component: Camel,
    isActive: async () => {
      return workspace.treeContainsDomainAndProperties(jmxDomain)
    },
  })

  treeProcessorRegistry.add('camel', camelTreeProcessor)
  helpRegistry.add('camel', 'Camel', help, order)
  preferencesRegistry.add('camel', 'Camel', CamelPreferences, order)

  getCamelVersions().then(versions => {
    log.info('Using Camel versions:', versions)
  })
}
