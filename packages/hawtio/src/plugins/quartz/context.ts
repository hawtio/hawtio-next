import { EVENT_REFRESH, eventService } from '@hawtiosrc/core'
import { PluginNodeSelectionContext } from '@hawtiosrc/plugins'
import { MBeanNode, MBeanTree } from '@hawtiosrc/plugins/shared'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { log, pluginName } from './globals'
import { QuartzIcon } from './icons'
import { quartzService } from './quartz-service'

/**
 * Custom React hook for using Quartz Scheduler MBeans.
 */
export function useQuartz() {
  const [tree, setTree] = useState(MBeanTree.createEmpty(pluginName))
  const { selectedNode, setSelectedNode } = useContext(PluginNodeSelectionContext)
  const [loaded, setLoaded] = useState(false)

  const selectedNodeRef = useRef(selectedNode)

  const populateTree = async () => {
    log.debug('Populate Quartz tree')
    const schedulers = (await quartzService.searchSchedulers()).map(node => {
      const scheduler = node.copyTo(node.getProperty('name') ?? node.name)
      scheduler.icon = QuartzIcon
      return scheduler
    })
    log.debug('Found schedulers:', schedulers)
    const newTree = MBeanTree.createFromNodes(pluginName, schedulers)
    setTree(newTree)

    // If none is selected, select the first scheduler automatically
    if (!selectedNodeRef.current) {
      selectedNodeRef.current = schedulers[0] ?? null
    }

    // Ensure the new version of the selected node is selected
    let newSelected: MBeanNode | null = null
    newTree.forEach(selectedNodeRef.current?.path() ?? [], node => {
      node.defaultExpanded = true
      newSelected = node
    })
    setSelectedNode(newSelected)
  }

  useEffect(() => {
    const loadTree = async () => {
      await populateTree()
      setLoaded(true)
    }

    const listener = () => {
      setLoaded(false)
      loadTree()
    }
    eventService.onRefresh(listener)

    loadTree()

    return () => eventService.removeListener(EVENT_REFRESH, listener)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { tree, loaded, selectedNode, setSelectedNode }
}

type QuartzContext = {
  tree: MBeanTree
  selectedNode: MBeanNode | null
  setSelectedNode: (selected: MBeanNode | null) => void
}

export const QuartzContext = createContext<QuartzContext>({
  tree: MBeanTree.createEmpty(pluginName),
  selectedNode: null,
  setSelectedNode: () => {
    // no-op
  },
})
