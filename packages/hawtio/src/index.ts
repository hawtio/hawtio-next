import { configManager } from './core'

export * from './core'
export * from './plugins'
export * from './Hawtio'

// Register Hawtio React component version
configManager.addProductInfo('Hawtio React', '__PACKAGE_VERSION_PLACEHOLDER__')
