import { HawtioPlugin } from '@hawtiosrc/core'
import { keycloak } from './auth/keycloak'
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

  connect()
  jmx()
  rbac()
  camel()
  runtime()
  logs()
  quartz()
  springboot()
}

export * from './connect'
export * from './context'
export * from './shared'
