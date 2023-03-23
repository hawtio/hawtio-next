import { hawtio, HawtioPlugin } from '@hawtio/react'
import { Example1 } from './Example1'

export const registerExample1: HawtioPlugin = () => {
  hawtio.addPlugin({
    id: 'example1',
    title: 'Example 1',
    path: '/example1',
    component: Example1,
    isActive: async () => true,
  })
}
