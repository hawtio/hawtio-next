import React, { useContext } from 'react'
import { Location } from './types'
import { BrowserRouterContext, NavigateFunction } from './browser-router-context'

/**
 * Returns true if this component is a descendant of a <Router>.
 */
export function useInRouterContext(): boolean {
  return React.useContext(BrowserRouterContext) != null
}

export function useNavigate(): NavigateFunction {
  if (!useInRouterContext) {
    throw new Error('Using useNavigate outside route context')
  }

  const { navigate } = useContext(BrowserRouterContext)
  return navigate
}

export function useLocation(): Location {
  if (!useInRouterContext) {
    throw new Error('Using useLocation outside route context')
  }

  const { route } = useContext(BrowserRouterContext)

  return {
    pathname: route,
  }
}
