// This entry point re-exports selected parts of Hawtio that should be used during Hawtio initialization
// so the resulting JavaScript bundle is as small as possible.
// Some functions and classes are exported as-is, but some are exported with explicit interface, so
// not all public methods are available
// For full access, applications should import "@hawtio/react" package instead of "@hawtio/react/init"

import { configManager as configManagerService, type IConfigManager, TaskState } from './core/config-manager'
import { hawtio as hawtioService, type IHawtio } from './core/core'

export const configManager: IConfigManager = configManagerService
export const hawtio: IHawtio = hawtioService
export { TaskState }

export * from './ui/init/HawtioInitialization'
