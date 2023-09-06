import { hawtio, HawtioPlugin } from '@hawtio/react'
import { Example3 } from './Example3'
import { ToolbarItemComp1, ToolbarItemComp2 } from './ToolbarItemComp'

export const registerExample3: HawtioPlugin = () => {
  hawtio.addPlugin({
    id: 'example3',
    title: 'Example 3',
    path: '/example3',
    component: Example3,
    headerItems: [ToolbarItemComp1, ToolbarItemComp2],
    isActive: async () => true,
  })
}
