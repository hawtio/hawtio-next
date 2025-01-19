import { PropsWithChildren, useContext } from 'react'
import { BrowserRouterContext } from './browser-router-context'
import { RouteContext } from './route-context'
import { joinPaths } from '@hawtiosrc/util/urls'
import { log } from './globals'

interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string
}

export const Link: React.FunctionComponent<PropsWithChildren<LinkProps>> = props => {
  const { navigate } = useContext(BrowserRouterContext)
  const { routePath } = useContext(RouteContext)

  const onLinkClick = () => {
    log.debug(`Link (route-path ${routePath}) to path (props.to) ${props.to}`)
    let absPath = props.to
    if (!absPath.startsWith('/')) absPath = joinPaths(routePath, absPath)

    navigate(absPath)
  }

  return (
    <a style={props.style} className={props.className} onClick={onLinkClick}>
      {props.children}
    </a>
  )
}
