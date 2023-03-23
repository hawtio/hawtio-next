import { HawtioPlugin } from '@hawtiosrc/core'
import { treeProcessorRegistry } from '@hawtiosrc/plugins/shared'
import { rbacTreeProcessor } from './tree-processor'

export const rbac: HawtioPlugin = () => {
  treeProcessorRegistry.add('rbac', rbacTreeProcessor)
}
