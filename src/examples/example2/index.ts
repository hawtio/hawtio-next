import Example2 from './Example2'
import hawtio from '@hawtio/core'

const registerExample2 = () => {
  hawtio.addPlugin({
    id: 'example2',
    title: 'Example 2',
    path: '/example2',
    component: Example2,
  })
}

export default registerExample2
