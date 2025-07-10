import { registerDisabled } from './disabled'
import { registerExample1 } from './example1'
import { registerExample1Deferred } from './example1-deferred'
import { registerExample2 } from './example2'
import { registerExample3 } from './example3'
import { registerRemoteExamplesStatically } from './remote-static-loader'

/**
 * A function similar to Hawtio version of `registerPlugins` which simply calls other functions which register
 * individual plugins using Hawtio API.
 */
export const registerExamples = () => {
  // examples 1-3 and disabled are normal plugins imported in JavaScript using import or import() without
  // any ModuleFederation support
  registerExample1()
  registerExample1Deferred()
  registerExample2()
  registerExample3()
  registerDisabled()

  registerRemoteExamplesStatically()
}
