import { configManager, hawtio, HawtioPlugin } from '@hawtio/react'
import { Example2 } from './Example2'

export const registerExample2: HawtioPlugin = () => {
  hawtio.addPlugin({
    id: 'example2',
    title: 'Example 2',
    path: '/example2',
    component: Example2,
    isActive: async () => true,
  })
}

// Plugin can extend Hawtconfig
configManager.configure(config => {
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
