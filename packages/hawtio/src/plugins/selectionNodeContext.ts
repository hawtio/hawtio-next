import { createContext, useEffect, useState } from 'react'
import { MBeanNode } from '@hawtiosrc/plugins/shared'
import { selectionNodeDataService, MBeanAttributeData } from './selection-node-data-service'

/**
 * Custom React hook for using JMX MBean tree.
 */
export function usePluginNodeSelected() {
  const [selectedNode, setSelectedNode] = useState<MBeanNode | null>(null)
  const [selectedNodeAttributes, setSelectedNodeAttributes] = useState<MBeanAttributeData>({
    nodeData: undefined,
    children: {},
  })
  const [isReadingAttributes, setIsReadingAttributes] = useState<boolean>(false)

  useEffect(() => {
    ;(async () => {
      setIsReadingAttributes(true)
      setSelectedNodeAttributes(await selectionNodeDataService.getAttributesForNode(selectedNode))
      setIsReadingAttributes(false)
    })()
  }, [selectedNode])

  return { selectedNode, setSelectedNode, selectedNodeAttributes, isReadingAttributes }
}

type PluginNodeSelectionContext = {
  selectedNode: MBeanNode | null
  setSelectedNode: (selectedNode: MBeanNode | null) => void
  selectedNodeAttributes: MBeanAttributeData
  isReadingAttributes: boolean
}

export const PluginNodeSelectionContext = createContext<PluginNodeSelectionContext>({
  selectedNode: null,
  setSelectedNode: () => {
    /* no-op */
  },
  selectedNodeAttributes: { nodeData: undefined, children: {} },
  isReadingAttributes: false,
})
