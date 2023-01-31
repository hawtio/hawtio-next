import { connect } from './connect'
import { jmx } from './jmx'
import { camel } from './camel'

export const registerPlugins = () => {
  connect()
  jmx()
  camel()
}
