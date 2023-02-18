import { MBeanNode } from '@hawtiosrc/plugins/shared/tree'

/**
 * Base props type for applying to components that require access to the selected node
 */
export interface NodeProps {
  node: MBeanNode,
}
