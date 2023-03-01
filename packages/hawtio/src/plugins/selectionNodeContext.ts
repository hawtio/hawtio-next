import { createContext, useState } from 'react'
import { MBeanNode } from '@hawtiosrc/plugins/shared'

/**
 * Custom React hook for using JMX MBean tree.
 */
export function usePluginNodeSelected() {
  const [ selectedNode, setSelectedNode ] = useState<MBeanNode | null>(null)
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
