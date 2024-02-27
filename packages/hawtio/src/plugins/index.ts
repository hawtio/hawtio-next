import type { HawtioPlugin } from '@hawtiosrc/core'
import { keycloak } from './auth/keycloak'
import { oidc } from './auth/oidc'
import { camel } from './camel'
import { connect } from './connect'
import { jmx } from './jmx'
import { logs } from './logs'
import { quartz } from './quartz'
import { rbac } from './rbac'
import { runtime } from './runtime'
import { springboot } from './springboot'

/**
 * Registers the builtin plugins for Hawtio React.
 *
 * The order of loading the builtin plugins is defined by this function.
 */
export const registerPlugins: HawtioPlugin = () => {
  // Auth plugins should be loaded before other plugins
  keycloak()
  oidc()

  connect()
  jmx()
  rbac()
  camel()
  runtime()
  logs()
  quartz()
  springboot()
}

// Export each plugin's entry point so that a custom console assembler can select which to bundle
export { camel, connect, jmx, keycloak, oidc, logs, quartz, rbac, runtime, springboot }

// Common plugin API
export * from './connect'
export * from './context'
export * from './shared'
