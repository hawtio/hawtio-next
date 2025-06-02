import { hawtio, HawtioPlugin } from '@hawtio/react'

export const registerExample1: HawtioPlugin = () => {
  import("./Example1").then(m => {
    hawtio.addPlugin({
      id: 'example1',
      title: 'Example 1',
      path: '/example1',
      component: m.Example1,
      isActive: async () => true,
    })
  })
}
