import { hawtio, type HawtioPlugin } from '@hawtio/react'

export const registerExample3: HawtioPlugin = () => {
  hawtio.addDeferredPlugin('example3', async () => {
    return import('./ui').then(m => {
      return {
        id: 'example3',
        title: 'Example 3',
        path: '/example3',
        component: m.Example3,
        headerItems: [
          // Header item local to the plugin
          m.Example3HeaderItem1,
          // Header item universal to the console
          // You can also make it local by setting universal=false
          { component: m.Example3HeaderItem2, universal: true },
        ],
        isActive: async () => true,
      }
    })
  })
}
