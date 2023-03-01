import { camel } from './camel'
import { connect } from './connect'
import { jmx } from './jmx'

export const registerPlugins = () => {
  connect()
  jmx()
  camel()
}

export { jolokiaService } from './connect'
export { PluginNodeSelectionContext, usePluginNodeSelected } from './selectionNodeContext'
