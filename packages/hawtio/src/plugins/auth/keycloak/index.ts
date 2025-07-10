import { type HawtioPlugin } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import help from './help.md'
import { keycloakService } from './keycloak-service'

export const keycloak: HawtioPlugin = () => {
  let helpRegistered = false
  keycloakService.registerUserHooks(() => {
    if (!helpRegistered) {
      helpRegistry.add('keycloak', 'Keycloak', help, 21)
      helpRegistered = true
    }
  })
}
