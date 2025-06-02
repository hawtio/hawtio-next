import { HawtioPlugin, hawtio } from '@hawtiosrc/core'
import { connectService, workspace } from '@hawtiosrc/plugins/shared'
import { pluginId, pluginPath, pluginTitle } from './globals'

/**
 * Target application status plugin,
 * only active if the workspace contains no mbeans, ie, totally empty.
 * and / or the workspace has produced errors.
 * Will communicate this to the user with a notice component.
 */
export const consoleStatus: HawtioPlugin = () => {
  import("./ui").then(m => {
    hawtio.addPlugin({
      id: pluginId,
      title: pluginTitle,
      path: pluginPath,
      component: m.ConsoleStatus,
      isActive: async () => {
        const connection = await connectService.getCurrentConnection()
        const beans = await workspace.hasMBeans()
        const errors = await workspace.hasErrors()

        if (!connection) return false // no connection yet so no beans in workspace

        return !beans || errors // either no beans or workspace has errors
      },
    })
  })
}
