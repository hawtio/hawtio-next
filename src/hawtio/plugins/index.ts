import { connect } from './connect'
import { jmx } from './jmx'

export const registerPlugins = () => {
  connect()
  jmx()
}
