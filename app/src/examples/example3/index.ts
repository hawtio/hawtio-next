import { hawtio } from '@hawtio/react'
import { Example3 } from './Example3'

export const registerExample3 = () => {
  hawtio.addPlugin({
    id: 'example3',
    title: 'Example 3',
    path: '/example3',
    component: Example3,
    isActive: async () => true
  })
}
