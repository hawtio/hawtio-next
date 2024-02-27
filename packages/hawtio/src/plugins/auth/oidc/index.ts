import { HawtioPlugin } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import help from './help.md'
import { oidcService } from './oidc-service'

const oidc: HawtioPlugin = () => {
  oidcService.registerUserHooks()
  helpRegistry.add('oidc', 'OpenID Connect', help, 22)
}

export { oidc, oidcService }
