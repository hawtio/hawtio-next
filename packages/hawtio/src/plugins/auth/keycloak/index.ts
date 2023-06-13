import { HawtioPlugin } from '@hawtiosrc/core'
import { helpRegistry } from '@hawtiosrc/help/registry'
import help from './help.md'
import { keycloakService } from './keycloak-service'

export const keycloak: HawtioPlugin = () => {
  keycloakService.registerUserHooks()
  helpRegistry.add('keycloak', 'Keycloak', help, 21)
}
