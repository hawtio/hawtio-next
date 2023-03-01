import { createContext, useEffect, useState, useContext } from 'react'
import { TreeViewDataItem } from '@patternfly/react-core'
import { PluginNodeSelectionContext } from '@hawtiosrc/plugins'
import { workspace, MBeanNode, MBeanTree } from '@hawtiosrc/plugins/shared'
import { pluginName, pluginPath, jmxDomain } from './globals'
import { useNavigate } from 'react-router-dom'
import { eventService, EVENT_REFRESH } from '@hawtiosrc/core'

/**
 * Custom React hook for using Camel MBean tree.
 */
export function useCamelTree() {
  const [tree, setTree] = useState(MBeanTree.createEmpty(pluginName))
  const [loaded, setLoaded] = useState(false)
  const { selectedNode, setSelectedNode } = useContext(PluginNodeSelectionContext)
  const navigate = useNavigate()

  const populateTree = async () => {
    const wkspTree: MBeanTree = await workspace.getTree()
    const rootNode = wkspTree.findDescendant(node => node.name === jmxDomain)
    if (rootNode) {
      const subTree: MBeanTree = MBeanTree.createFromNodes(pluginName, [rootNode])
      setTree(subTree)
      if (rootNode && rootNode.children && rootNode.children.length > 0) {
        const r: TreeViewDataItem = rootNode as TreeViewDataItem
        const c: TreeViewDataItem = rootNode.children[0] as TreeViewDataItem
        c.defaultExpanded = true
        r.defaultExpanded = true
        if (selectedNode) {
          setSelectedNode(selectedNode)
        } else {
          setSelectedNode(rootNode.children[0])
        }
        /* On population of tree, ensure the url path is returned to the base plugin path */
        navigate(pluginPath)
      }
    } else {
      setTree(wkspTree)
      // No camel contexts so redirect to the JMX view and select the first tree node
      navigate('jmx')
      eventService.notify({
        type: 'warning',
        message: 'No Camel domain detected in target. Redirecting to back to jmx.',
      })
    }
  }

  useEffect(() => {
    const loadTree = async () => {
      await populateTree()
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
  })

  return { tree, loaded, selectedNode, setSelectedNode }
}

type CamelContext = {
  tree: MBeanTree
  selectedNode: MBeanNode | null
  setSelectedNode: (selected: MBeanNode | null) => void
}

export const CamelContext = createContext<CamelContext>({
  tree: MBeanTree.createEmpty(pluginName),
  selectedNode: null,
  setSelectedNode: () => {
    /* no-op */
  },
})
