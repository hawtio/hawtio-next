import { PropsWithChildren } from 'react'
import { BrowserRouterContext, useBrowserRouterContext } from './browser-router-context'

type BrowserRouterProps = {
  basename?: string
}

export const BrowserRouter: React.FunctionComponent<PropsWithChildren<BrowserRouterProps>> = props => {
  const { children } = props
  const { route, navigate } = useBrowserRouterContext()

  return <BrowserRouterContext.Provider value={{ route, navigate }}>{children}</BrowserRouterContext.Provider>
}
