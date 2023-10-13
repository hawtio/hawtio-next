import { Logger } from '@hawtiosrc/core/logging'

export const pluginId = 'logs'
export const pluginName = 'hawtio-logs'
export const pluginPath = '/logs'
export const log = Logger.get(pluginName)
