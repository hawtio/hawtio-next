import { hawtio, type HawtioPlugin } from '@hawtio/react'

// This is the recommended approach to register Hawtio plugins which use Patternfly components.
// Instead of importing the component using `import` statement, the component module is imported
// with `import()` operator. This requires different approach and new hawtio.addDeferredPlugin() API
export const registerExample1Deferred: HawtioPlugin = () => {
  hawtio.addDeferredPlugin('example1b', async () => {
    return import('./Example1').then(m => {
      return {
        id: 'example1b',
        title: 'Example 1 (deferred)',
        path: '/example1b',
        component: m.Example1,
        isActive: async () => true,
      }
    })
  })
}
