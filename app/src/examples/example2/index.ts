import { configManager, hawtio, type Hawtconfig, type HawtioPlugin } from '@hawtio/react'

export const registerExample2: HawtioPlugin = () => {
  hawtio.addDeferredPlugin('example2', async () => {
    return import('./Example2').then(m => {
      return {
        id: 'example2',
        title: 'Example 2',
        path: '/example2',
        component: m.Example2,
        isActive: async () => true,
      }
    })
  })
}

// Plugin can extend Hawtconfig and we can do it in a synchronous way
configManager.configure((config: Hawtconfig) => {
  if (!config.about) {
    config.about = {}
  }
  const description = config.about.description
  config.about.description = (description ?? '') + ' This text is added by the example 2 plugin.'
  if (!config.about.productInfo) {
    config.about.productInfo = []
  }
  config.about.productInfo.push({ name: 'Example 2', value: '1.0.0' })
})
