import React from 'react'
import { RouteContext } from './route-context'

type RouteProps = {
  path?: string
  index?: boolean
  element: JSX.Element
}

export const Route: React.FunctionComponent<RouteProps> = props => {
  return <></>
}

type ResolvedRouteProps = {
  path: string
  pathExp: string
  element: JSX.Element
}

export const ResolvedRoute: React.FunctionComponent<ResolvedRouteProps> = props => {
  return <RouteContext.Provider value={{ routePath: props.path }}>{props.element}</RouteContext.Provider>
}
