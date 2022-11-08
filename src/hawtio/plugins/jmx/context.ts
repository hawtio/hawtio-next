import React, { createContext, useEffect, useState } from 'react'
import { MBeanTree } from './tree'
import { workspace } from './workspace'

/**
 * Custom React hook for using JMX MBean tree.
 */
export function useMBeanTree() {
  const [tree, setTree] = useState<MBeanTree>(new MBeanTree({}))
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const loadTree = async () => {
      const tree = await workspace.getTree()
      setTree(tree)
      setLoaded(true)
    }
    loadTree()
  }, [])

  return { tree, loaded, setTree }
}

type MBeanTreeContext = {
  tree: MBeanTree
  setTree: React.Dispatch<React.SetStateAction<MBeanTree>>
}

export const MBeanTreeContext = createContext<MBeanTreeContext>({
  tree: new MBeanTree({}),
  setTree: () => { /* no-op */ },
})
