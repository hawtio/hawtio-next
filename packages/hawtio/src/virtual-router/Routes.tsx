import React, { PropsWithChildren, useContext } from 'react'
import { BrowserRouterContext } from './browser-router-context'
import { RouteContext } from './route-context'
import { ResolvedRoute, Route } from './Route'
import { routeService } from './route-service'
import { log } from './globals'

interface ResolvedRoute {
  path: string
  pathExp: string
  element: JSX.Element
}

type RoutesProps = {
  /*
   * Include for future debugging / maintenance
   * Simply need to add a componentName attribute
   * to the relevant <Routes>
   */
  componentName?: string
}

export const Routes: React.FunctionComponent<PropsWithChildren<RoutesProps>> = props => {
  // Extract route from BrowserRouterContext
  const { route } = useContext(BrowserRouterContext)

  /*
   * If this <Routes> is nested inside a <Route> then it will
   * have an ancestor <Route> and <RouteContext> which contains
   * the correctly assigned parent of this <Routes>. Use that
   * as the base path for this <Routes>
   */
  const ancestorRouteCtx = useContext(RouteContext)

  // The route chosen to be applicable
  const routeChosen: ResolvedRoute[] = []

  log.debug(`Initalised <Routes with ancestor parent of ${ancestorRouteCtx.routePath}, route ${route}`)

  if (!props.children) {
    throw new Error('<Routes> element cannot be empty')
  }

  log.debug(`=== <Routes> ${props.componentName} ===`)

  /*
   * Loop through the <Routes> children to determine which
   * one should be chosen. Since only the first one applicable
   * can be chosen (not > 1) then check if one has already
   * been found.
   */
  React.Children.forEach(props.children, child => {
    if (!React.isValidElement(child) || child.type !== Route) return

    if (routeChosen.length > 0) {
      log.debug(`Chosen a route ${routeChosen[0]?.pathExp}`)
      return // Nothing more to do
    }

    const { path, pathExp } = routeService.resolvePath(ancestorRouteCtx.routePath, child.props.path, child.props.index)

    log.debug(`Testing if route ${route} is applicable using path ${path}, pathExp ${pathExp}`)
    const options = {
      index: child.props.index,
      path: path,
      pathExp: pathExp,
      parent: ancestorRouteCtx.routePath,
    }

    if (routeService.isRouteApplicable(route, options)) {
      routeChosen.push({
        path: path,
        pathExp: pathExp,
        element: child.props.element,
      })
    }
  })

  if (routeChosen.length === 0 || !routeChosen[0]) {
    /*
     * Will mean that <Routes> could be resolved empty but this
     * allows for components that have asynchronous intialisation
     * wrapped in useEffect hook to load twice and on the 2nd iteration
     * have a <Route> that satisfies the requested route path.
     *
     * Should the app remain with an empty <Routes> then that would be
     * a bug that needs fixing by changing <Route> path expressions.
     */
    return <></>
  } else {
    return (
      <ResolvedRoute path={routeChosen[0].path} pathExp={routeChosen[0].pathExp} element={routeChosen[0].element} />
    )
  }
}
