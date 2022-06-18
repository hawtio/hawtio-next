import Example1 from './Example1'
import hawtio from '@hawtio/core'

const registerExample1 = () => {
  hawtio.addPlugin({
    id: 'example1',
    title: 'Example 1',
    path: '/example1',
    component: Example1,
  })
}

export default registerExample1
