import { hawtio, HawtioPlugin } from '@hawtio/react'
import { DisabledExample } from './Disabled'

export const registerDisabled: HawtioPlugin = () => {
  hawtio.addPlugin({
    id: 'disabled',
    title: 'Disabled',
    path: 'disabled',
    component: DisabledExample,
    isActive: async () => true,
  })
}
