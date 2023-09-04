import { HawtioPlugin } from '@hawtiosrc/core'
import { keycloak } from './auth/keycloak'
import { camel } from './camel'
import { connect } from './connect'
import { jmx } from './jmx'
import { logs } from './logs'
import { rbac } from './rbac'

export const registerPlugins: HawtioPlugin = () => {
  // Auth plugins should be loaded before other plugins
  keycloak()

  connect()
  jmx()
  rbac()
  camel()
  logs()
}

export * from './connect'
export * from './context'
export * from './shared'
