// This entry point re-exports selected parts of Hawtio that should be used during Hawtio initialization
// so the resulting JavaScript bundle is as small as possible.
// Some functions and classes are exported as-is, but some are exported with explicit interface, so
// not all public methods are available
// For full access, applications should import "@hawtio/react" package instead of "@hawtio/react/init"

import { configManager as configManagerFull, type IConfigManager, TaskState } from './core/config-manager'

export * from './core/core'
export * from './ui/init/HawtioInitialization'

export const configManager: IConfigManager = configManagerFull
export { TaskState }
