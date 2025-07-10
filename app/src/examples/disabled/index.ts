import { hawtio, type HawtioPlugin } from '@hawtio/react'

export const registerDisabled: HawtioPlugin = () => {
  hawtio.addDeferredPlugin('disabled', async () => {
    return import('./Disabled').then(m => {
      return {
        id: 'disabled',
        title: 'Disabled',
        path: '/disabled',
        component: m.DisabledExample,
        // This plugin is disabled with "disabledRoutes" in hawtconfig.json, but with "isActive"
        isActive: async () => true,
      }
    })
  })
}
