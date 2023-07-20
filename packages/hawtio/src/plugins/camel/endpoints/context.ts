import { createContext, useState } from 'react'
import { CamelModelSchema } from '../camel-service'

export function useAddEndpointContext() {
  const [addEndpoint, showAddEndpoint] = useState(false)
  const [componentNames, setComponentNames] = useState<string[] | null>(null)
  const [componentName, setComponentName] = useState('')
  const [componentSchema, setComponentSchema] = useState<Record<string, unknown>>({})
  const [endpointPath, setEndpointPath] = useState<string>('')
  const [endpointParameters, setEndpointParameters] = useState<Record<string, string>>({})

  return {
    addEndpoint,
    showAddEndpoint,
    componentNames,
    setComponentNames,
    componentName,
    setComponentName,
    componentSchema,
    setComponentSchema,
    endpointPath,
    setEndpointPath,
    endpointParameters,
    setEndpointParameters,
  }
}

type AddEndpointContext = {
  showAddEndpoint: (value: boolean) => void
  componentNames: string[] | null
  setComponentNames: (names: string[]) => void
  componentName: string
  setComponentName: (names: string) => void
  componentSchema: Record<string, unknown>
  setComponentSchema: (componentSchema: CamelModelSchema) => void
  endpointPath: string
  setEndpointPath: (endPointPath: string) => void
  endpointParameters: Record<string, string>
  setEndpointParameters: (componentSchema: Record<string, string>) => void
}

export const AddEndpointContext = createContext<AddEndpointContext>({
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
  endpointPath: '',
  setEndpointPath: (endPointPath: string) => {
    /* no-op */
  },
  endpointParameters: {},
  setEndpointParameters: (endPointParameters: Record<string, string>) => {
    /* no-op */
  },
})
