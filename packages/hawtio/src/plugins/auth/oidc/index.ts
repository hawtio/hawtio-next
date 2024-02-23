import { HawtioPlugin } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import help from './help.md'
import { oidcService } from './oidc-service'
import { Logger } from '@hawtiosrc/core'

const pluginName = 'hawtio-oidc'
const log = Logger.get(pluginName)

const oidc: HawtioPlugin = () => {
  log.info('Loading oidc() plugin')
  oidcService.registerUserHooks()
  helpRegistry.add('oidc', 'OpenID Connect', help, 22)
}

export { oidc, oidcService }
