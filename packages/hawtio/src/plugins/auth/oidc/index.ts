import { HawtioPlugin } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import help from './help.md'
import { oidcService } from './oidc-service'

const oidc: HawtioPlugin = () => {
  let helpRegistered = false
  oidcService.registerUserHooks(() => {
    if (!helpRegistered) {
      helpRegistry.add('oidc', 'OpenID Connect', help, 22)
      helpRegistered = true
    }
  })
}

export { oidc, oidcService }
