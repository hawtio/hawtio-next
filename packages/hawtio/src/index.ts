import { configManager } from './core'

export * from './Hawtio'
export * from './core'
export type { HawtioPlugin } from './core'
export { helpRegistry } from './help'
export * from './plugins'
export { preferencesRegistry } from './preferences'

// Register Hawtio React component version
configManager.addProductInfo('Hawtio React', '__PACKAGE_VERSION_PLACEHOLDER__')
