import { createContext, useState } from 'react'
import { CamelNodeData } from './visualization-service'

const noOpAction = (nodeData: CamelNodeData) => {
  /* no-op */
}

export function useRouteDiagramContext() {
  const [graphNodeData, setGraphNodeData] = useState<CamelNodeData[]>([])
  const [graphSelection, setGraphSelection] = useState<string>('')
  const [showStatistics, setShowStatistics] = useState<boolean>(true)
  const [doubleClickAction, setDoubleClickAction] = useState<(nodeData: CamelNodeData) => void>(noOpAction)
  const [annotations, setAnnotations] = useState<Annotation[]>([])

  return {
    graphNodeData,
    setGraphNodeData,
    graphSelection,
    setGraphSelection,
    showStatistics,
    setShowStatistics,
    doubleClickAction,
    setDoubleClickAction,
    annotations,
    setAnnotations,
  }
}

export type Annotation = {
  nodeId: string
  element: JSX.Element
}

export type RouteDiagramContext = {
  graphNodeData?: CamelNodeData[]
  setGraphNodeData: (graphNodeData: CamelNodeData[]) => void
  graphSelection?: string
  setGraphSelection: (graphSelection: string) => void
  showStatistics?: boolean
  setShowStatistics?: (value: boolean) => void
  doubleClickAction?: (nodeData: CamelNodeData) => void
  setDoubleClickAction?: (fn: (nodeData: CamelNodeData) => void) => void
  annotations?: Annotation[]
  setAnnotations?: (annotations: Annotation[]) => void
}

export const RouteDiagramContext = createContext<RouteDiagramContext>({
  graphNodeData: [],
  setGraphNodeData: (graphNodeData: CamelNodeData[]) => {
    /* no-op */
  },
  graphSelection: '',
  setGraphSelection: (graphSelection: string) => {
    /* no-op */
  },
  showStatistics: true,
  setShowStatistics: (value: boolean) => {
    /* no-op */
  },
  doubleClickAction: (nodeData: CamelNodeData) => {
    /* no-op */
  },
  setDoubleClickAction: (fn: (nodeData: CamelNodeData) => void) => {
    /* no-op */
  },
  annotations: [],
  setAnnotations: (annotations: Annotation[]) => {
    /* no-op */
  },
})
