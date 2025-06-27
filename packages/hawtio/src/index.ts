import { configManager } from './core'

// Hawtio API
export * from './auth'
export * from './core'
export * from './help'
export * from './plugins'
export * from './preferences'

// Register Hawtio React component version
configManager.addProductInfo('Hawtio React', '__PACKAGE_VERSION_PLACEHOLDER__')
