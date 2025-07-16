import { hawtio, type HawtioPlugin } from '@hawtio/react'

// In this example we want to import "./Example1" module in asynchronous way, so Webpack has a chance
// to put PatternFly-related code in separate chunk.
// import() "operator" (opposite to import "statement") is dynamic, returns a Promise resolved with
// the imported JavaScript module.
// At first glance we can call hawtio.addPlugin() in the `.then()` block of the promise, but this makes
// the surrounding registerExample1Wrong() function effectively asynchronous.
// When we call this function (directly or indirectly) from bootstrap.tsx, there's a risk that we call
// hawtio.bootstrap() before import("./Example1") is even resolved! This will result in `addPlugin()` being called
// after Hawtio has already bootstrapped.
export const registerExample1Wrong: HawtioPlugin = () => {
  import('./Example1').then(m => {
    hawtio.addPlugin({
      id: 'example1c',
      title: 'Example 1 (wrong)',
      path: '/example1c',
      component: m.Example1,
      isActive: async () => true,
    })
  })
}
