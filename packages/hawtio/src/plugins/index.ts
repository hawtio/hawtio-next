import { HawtioPlugin } from '@hawtiosrc/core'
import { camel } from './camel'
import { connect } from './connect'
import { jmx } from './jmx'
import { rbac } from './rbac'

export const registerPlugins: HawtioPlugin = () => {
  connect()
  jmx()
  rbac()
  camel()
}

export * from './connect'
export * from './selectionNodeContext'
export * from './shared'
