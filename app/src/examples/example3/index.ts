import { hawtio, HawtioPlugin } from '@hawtio/react'
import { Example3 } from './Example3'
import { Example3HeaderItem1, Example3HeaderItem2 } from './Example3HeaderItems'

export const registerExample3: HawtioPlugin = () => {
  hawtio.addPlugin({
    id: 'example3',
    title: 'Example 3',
    path: '/example3',
    component: Example3,
    headerItems: [
      // Header item local to the plugin
      Example3HeaderItem1,
      // Header item universal to the console
      // You can also make it local by setting universal=false
      { component: Example3HeaderItem2, universal: true },
    ],
    isActive: async () => true,
  })
}
