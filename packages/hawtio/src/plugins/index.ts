import { HawtioPlugin } from '__root__/core'
import { connect } from './connect'
import { jmx } from './jmx'
import { rbac } from './rbac'

export const registerCorePlugins: HawtioPlugin = () => {
  connect()
  jmx()
  rbac()
}

export { jolokiaService } from './connect'
export type { AttributeValues } from './connect'
export { PluginNodeSelectionContext, usePluginNodeSelected } from './selectionNodeContext'
export * from './shared'
export type { TreeProcessor } from './shared'
