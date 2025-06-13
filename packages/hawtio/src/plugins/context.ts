import { createContext, useState } from 'react'
import { MBeanNode } from '@hawtiosrc/plugins/shared'

/**
 * Custom React hook for using a selected node from JMX plugin.
 *
 * This hook holds:
 * * a state for `selectedNode` react value
 *
 * This hook doesn't synchronize with any external service.
 */
export function usePluginNodeSelected() {
  const [selectedNode, setSelectedNode] = useState<MBeanNode | null>(null)
  return { selectedNode, setSelectedNode }
}

export type PluginNodeSelectionContext = {
  /** {@link MBeanNode} selected in the JMX tree, stored in `usePluginNodeSelected` hook's state. */
  selectedNode: MBeanNode | null
  /** State setter for currently selected JMX node. */
  setSelectedNode: (selectedNode: MBeanNode | null) => void
}

/**
 * PluginNodeSelectionContext gives access to:
 * * selected node in JMX tree
 * * function to set currently selected node (state setter function)
 *
 * This context is _provided_ in top level `<HawtioPage>` component and the values come from
 * `usePluginNodeSelected` hook.
 */
export const PluginNodeSelectionContext = createContext<PluginNodeSelectionContext>({
  selectedNode: null,
  setSelectedNode: () => {
    /* no-op */
  },
})
