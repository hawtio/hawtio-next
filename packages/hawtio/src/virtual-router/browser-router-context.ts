import { createContext, useState } from 'react'
import { log } from './globals'

export type NavigateFunction = (path: string | number) => void

/**
 * Custom React hook for routing in Hawtio.
 */
export function useBrowserRouterContext() {
  const [route, setRoute] = useState<string>('/')

  // Setup the navigate function
  const navigate = (path: string | number) => {
    if (typeof path !== 'string' || path.length == 0) {
      setRoute('/')
      return
    }

    log.debug(`Navigating to ${path}`)

    if (path === route) return // nothing to do

    log.debug(`navigate to path ${path} current route is ${route}`)

    if (!path.startsWith('/')) {
      // We only process absolute paths - the parent route should have been
      // concatenated onto the requested relative path in the Routes component
      throw new Error(`The path ${path} to be navigated to is still relative`)
    }

    log.debug('Setting new Route of ' + path)
    setRoute(path)
  }

  return { route, navigate }
}

type BrowserRouterContext = {
  // current route of app
  route: string

  // function for navigating to a new route
  navigate: NavigateFunction
}

export const BrowserRouterContext = createContext<BrowserRouterContext>({
  route: '/',
  navigate: (path: string | number) => {
    // no-op
  },
})
