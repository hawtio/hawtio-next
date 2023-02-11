import { hawtio } from '@hawtio/react'
import { DisabledExample } from './Disabled'

export const registerDisabled = () => {
  hawtio.addPlugin({
    id: 'disabled',
    title: 'Disabled',
    path: 'disabled',
    component: DisabledExample,
    isActive: async () => true,
  })
}
