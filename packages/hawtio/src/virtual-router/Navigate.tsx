import { useContext, useEffect } from 'react'
import { Location } from './types'
import { useNavigate } from './hooks'
import { RouteContext } from './route-context'
import { joinPaths } from '@hawtiosrc/util/urls'
import { log } from './globals'

type NavigateProps = {
  to: Partial<Location> | string
}

export const Navigate: React.FunctionComponent<NavigateProps> = props => {
  const navigate = useNavigate()
  const { routePath } = useContext(RouteContext)

  log.debug(`Navigate (route-path ${routePath}) to path (props.to):`)
  log.debug(props.to)

  let absPath = ''
  if (typeof props.to === 'string') {
    absPath = props.to as string
  } else {
    const loc = props.to as Location
    if (loc.pathname) {
      absPath = loc.pathname
    }
  }

  if (!absPath.startsWith('/')) {
    absPath = joinPaths(routePath, absPath)
  }

  useEffect(() => {
    /*
     * Will always fire but ensure that <Routes> have
     * been successfully rendered first avoiding re-rendering errors
     */
    navigate(absPath)
  })

  return <></>
}
