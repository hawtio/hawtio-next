import { createContext, useEffect, useState } from 'react'
import { MBeanNode, MBeanTree } from './tree'
import { workspace } from './workspace'

/**
 * Custom React hook for using JMX MBean tree.
 */
export function useMBeanTree() {
  const [tree, setTree] = useState<MBeanTree>(new MBeanTree({}))
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
  tree: new MBeanTree({}),
  node: null,
  setNode: () => { /* no-op */ }
})
