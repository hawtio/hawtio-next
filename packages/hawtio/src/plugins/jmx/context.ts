import { createContext, useEffect, useState } from 'react'
import { workspace, MBeanNode, MBeanTree } from '@hawtio/plugins/shared'
import { pluginName } from './globals'

/**
 * Custom React hook for using JMX MBean tree.
 */
export function useMBeanTree() {
  const [tree, setTree] = useState<MBeanTree>(MBeanTree.createEmptyTree(pluginName))
  const [loaded, setLoaded] = useState(false)
  const [node, setNode] = useState<MBeanNode | null>(null)

  useEffect(() => {
    const loadTree = async () => {
      const tree = await workspace.getTree()
      setTree(tree)
      setLoaded(true)
    }
    loadTree()
  }, [])

  return { tree, loaded, node, setNode }
}

type MBeanTreeContext = {
  tree: MBeanTree
  node: MBeanNode | null
  setNode: (selected: MBeanNode) => void
}

export const MBeanTreeContext = createContext<MBeanTreeContext>({
  tree: MBeanTree.createEmptyTree(pluginName),
  node: null,
  setNode: () => { /* no-op */ }
})
