import { createContext, useState } from 'react'

export function useRouteContext() {
  const [routePath, setRoutePath] = useState<string>('')
  return { routePath, setRoutePath }
}

type RouteContext = {
  // absolute path of the nearest parent route component
  routePath: string
}

export const RouteContext = createContext<RouteContext>({
  routePath: '/',
})
