import { MBeanNode } from '@hawtio/react'
import { createContext, useContext, useState } from 'react'
import { CamelContext } from '../context'

export function useAddEndpointContext() {
  const { selectedNode } = useContext(CamelContext)
  const [addEndpoint, showAddEndpoint] = useState(false)
  const [componentNames, setComponentNames] = useState<string[] | null>(null)
  const [componentName, setComponentName] = useState('')
  const [componentSchema, setComponentSchema] = useState<Record<string, unknown>>({})
  const [endPointPath, setEndpointPath] = useState<string>('')
  const [endPointParameters, setEndPointParameters] = useState<Record<string, string>>({})

  return {
    addEndpoint,
    showAddEndpoint,
    selectedNode,
    componentNames,
    setComponentNames,
    componentName,
    setComponentName,
    componentSchema,
    setComponentSchema,
    endPointPath,
    setEndpointPath,
    endPointParameters,
    setEndPointParameters,
  }
}

type AddEndpointContext = {
  selectedNode: MBeanNode | null
  showAddEndpoint: (value: boolean) => void
  componentNames: string[] | null
  setComponentNames: (names: string[]) => void
  componentName: string
  setComponentName: (names: string) => void
  componentSchema: Record<string, unknown>
  setComponentSchema: (componentSchema: Record<string, unknown>) => void
  endPointPath: string
  setEndpointPath: (endPointPath: string) => void
  endPointParameters: Record<string, string>
  setEndPointParameters: (componentSchema: Record<string, string>) => void
}

export const AddEndpointContext = createContext<AddEndpointContext>({
  selectedNode: null,
  showAddEndpoint: (value: boolean) => {
    /* no-op */
  },
  componentNames: null,
  setComponentNames: (names: string[]) => {
    /* no-op */
  },
  componentName: '',
  setComponentName: (names: string) => {
    /* no-op */
  },
  componentSchema: {},
  setComponentSchema: (componentSchema: Record<string, unknown>) => {
    /* no-op */
  },
  endPointPath: '',
  setEndpointPath: (endPointPath: string) => {
    /* no-op */
  },
  endPointParameters: {},
  setEndPointParameters: (endPointParameters: Record<string, string>) => {
    /* no-op */
  },
})
