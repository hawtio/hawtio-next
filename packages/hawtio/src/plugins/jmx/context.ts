import { createContext, useEffect, useState, useContext } from 'react'
import { PluginNodeSelectionContext } from '@hawtiosrc/plugins'
import { workspace, MBeanNode, MBeanTree } from '@hawtiosrc/plugins/shared'
import { pluginName } from './globals'
import { eventService, EVENT_REFRESH } from '@hawtiosrc/core'

/**
 * Custom React hook for using JMX MBean tree.
 */
export function useMBeanTree() {
  const [tree, setTree] = useState(MBeanTree.createEmpty(pluginName))
  const [loaded, setLoaded] = useState(false)
  const { selectedNode, setSelectedNode } = useContext(PluginNodeSelectionContext)

  useEffect(() => {
    const loadTree = async () => {
      const tree = await workspace.getTree()
      setTree(tree)
      setLoaded(true)
    }

    const listener = () => {
      setSelectedNode(null)
      setLoaded(false)
      loadTree()
    }
    eventService.onRefresh(listener)

    loadTree()

    return () => eventService.removeListener(EVENT_REFRESH, listener)
  }, [])

  return { tree, loaded, selectedNode, setSelectedNode }
}

type MBeanTreeContext = {
  tree: MBeanTree
  selectedNode: MBeanNode | null
  setSelectedNode: (selected: MBeanNode | null) => void
}

export const MBeanTreeContext = createContext<MBeanTreeContext>({
  tree: MBeanTree.createEmpty(pluginName),
  selectedNode: null,
  setSelectedNode: () => {
    /* no-op */
  },
})
