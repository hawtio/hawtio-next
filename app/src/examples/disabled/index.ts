import { hawtio, type HawtioPlugin } from '@hawtio/react'

export const registerDisabled: HawtioPlugin = () => {
  import("./Disabled").then(m => {
    hawtio.addPlugin({
      id: 'disabled',
      title: 'Disabled',
      path: '/disabled',
      component: m.DisabledExample,
      isActive: async () => true,
    })
  })
}
