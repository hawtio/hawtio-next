import { HawtioPlugin } from '@hawtiosrc/core'
import { camel } from './camel'
import { connect } from './connect'
import { jmx } from './jmx'
import { keycloak } from './auth/keycloak'
import { rbac } from './rbac'

export const registerPlugins: HawtioPlugin = () => {
  // Auth plugins should be loaded before other plugins
  keycloak()

  connect()
  jmx()
  rbac()
  camel()
}

export * from './connect'
export * from './context'
export * from './shared'
