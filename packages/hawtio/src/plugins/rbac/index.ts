import { HawtioPlugin } from '__root__/core'
import { treeProcessorRegistry } from '__root__/plugins/shared'
import { rbacTreeProcessor } from './tree-processor'

export const rbac: HawtioPlugin = () => {
  treeProcessorRegistry.add('rbac', rbacTreeProcessor)
}
