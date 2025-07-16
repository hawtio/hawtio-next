import { hawtio, type HawtioPlugin } from '@hawtio/react'
import { Example1 } from './Example1'

// This is the simplest version of Plugin registration
// registerExample1() is a synchronous function, which calls synchronous hawtio.addPlugin().
// "Plugin" object directly refers to React/PatternFly component function "Example1".
// The drawback of this approach is that this file is statically "reaching to" all other files imported
// using "import" statement including PatternFly modules. Without using "shared" Webpack modules we can
// end up with very big initial chunk size.
export const registerExample1: HawtioPlugin = () => {
  hawtio.addPlugin({
    id: 'example1a',
    title: 'Example 1 (immediate)',
    path: '/example1a',
    component: Example1,
    isActive: async () => true,
  })
}
