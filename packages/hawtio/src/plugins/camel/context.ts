import { createContext, useEffect, useState } from 'react'
import { TreeViewDataItem } from '@patternfly/react-core'
import { workspace, MBeanNode, MBeanTree } from '@hawtio/plugins/shared'
import { pluginName, jmxDomain } from './globals'

/**
 * Custom React hook for using JMX MBean tree.
 */
export function useCamelTree() {
  const [tree, setTree] = useState<MBeanTree>(MBeanTree.createEmptyTree(pluginName))
  const [loaded, setLoaded] = useState(false)
  const [node, setNode] = useState<MBeanNode | null>(null)

  useEffect(() => {
    if (loaded) {
      return
    }

    const loadTree = async () => {
      populateTree()
      setLoaded(true)
    }
    loadTree()
  }, [loaded])

  const refresh = () => {
    setLoaded(false)
  }

  const populateTree = async () => {
    const wkspTree: MBeanTree = await workspace.getTree()
    if (wkspTree) {
      const rootNode = wkspTree.findDescendant(node => node.name === jmxDomain)
      if (rootNode) {
        const subTree: MBeanTree = MBeanTree.createMBeanTreeFromNodes(pluginName, [rootNode])
        setTree(subTree)
        if (rootNode && rootNode.children && rootNode.children.length > 0) {
          const r: TreeViewDataItem = (rootNode as TreeViewDataItem)
          const c: TreeViewDataItem = (rootNode.children[0] as TreeViewDataItem)
          c.defaultExpanded = true
          r.defaultExpanded = true
          setNode(rootNode.children[0])
        }
        //
        // 2. Somewhere in the bootstrapping need to refilter the camel content of the tree
        //    to reshape it as the camel context original - icons too!!!


        // Jmx.enableTree(this.$scope, this.$location, this.workspace, $(treeElementId), [rootNode])
        // this.updateSelectionFromURL()
      } else {
        console.log("TODO: reroute back to jmx view")
        setTree(wkspTree)
        // // No camel contexts so redirect to the JMX view and select the first tree node
        // if (tree.children && tree.children.length > 0) {
        //   const firstNode = tree.children[0]
        //   this.$location.path('/jmx/attributes').search({ 'nid': firstNode['id'] })
        // }
      }
    }
  }

  return { tree, loaded, refresh, node, setNode }
}

type CamelContext = {
  tree: MBeanTree
  node: MBeanNode | null
  setNode: (selected: MBeanNode | null) => void
}

export const CamelContext = createContext<CamelContext>({
  tree: MBeanTree.createEmptyTree(pluginName),
  node: null,
  setNode: () => { /* no-op */ }
})
