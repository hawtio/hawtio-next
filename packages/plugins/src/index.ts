import { HawtioPlugin, configManager } from '@hawtio/react'
import { camel } from './camel'

export const registerPlugins: HawtioPlugin = () => {
  camel()
}

export * from './camel'

// Register Hawtio React Plugins component version
configManager.addProductInfo('Hawtio React Plugins', '__PACKAGE_VERSION_PLACEHOLDER__')
