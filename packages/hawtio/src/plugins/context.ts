import { createContext, useState } from 'react'
import { MBeanNode } from '@hawtiosrc/plugins/shared'

/**
 * Custom React hook for using a selected node from JMX plugin.
 */
export function usePluginNodeSelected() {
  const [selectedNode, setSelectedNode] = useState<MBeanNode | null>(null)
  return { selectedNode, setSelectedNode }
}

type PluginNodeSelectionContext = {
  selectedNode: MBeanNode | null
  setSelectedNode: (selectedNode: MBeanNode | null) => void
}

export const PluginNodeSelectionContext = createContext<PluginNodeSelectionContext>({
  selectedNode: null,
  setSelectedNode: () => {
    /* no-op */
  },
})
