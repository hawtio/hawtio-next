import { PropsWithChildren } from 'react'
import { Location } from './types'
import { Link } from './Link'

type NavLinkProps = {
  to: Location | string
  className?: string
  style?: React.CSSProperties
}

export const NavLink: React.FunctionComponent<PropsWithChildren<NavLinkProps>> = props => {
  let path = ''
  if (typeof props.to === 'string') path = props.to as string
  else {
    const loc = props.to as Location
    path = loc.pathname
    if (loc.search) path = path + '?' + loc.search

    if (loc.hash) path = path + '?' + loc.hash
  }

  return (
    <Link to={path} className={props.className} style={props.style}>
      {props.children}
    </Link>
  )
}
