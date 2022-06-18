import Example3 from './Example3'
import hawtio from '@hawtio/core'

const registerExample3 = () => {
  hawtio.addPlugin({
    id: 'example3',
    title: 'Example 3',
    path: '/example3',
    component: Example3,
  })
}

export default registerExample3
