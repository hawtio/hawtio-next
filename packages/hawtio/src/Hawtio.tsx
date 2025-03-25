import React from 'react'
import { MemoryRouter, Route, Switch } from 'react-router-dom' // includes NavLink
import { hawtio } from './core'
import './Hawtio.css'
import { HawtioLogin } from './ui/login'
import { HawtioPage } from './ui/page'
import { INDEX, LOGIN, WILDCARD } from './RouteConstants'

export type HawtioProps = {
  basepath?: string
}

export const Hawtio: React.FunctionComponent<HawtioProps> = props => {
  const { basepath } = props

  if (basepath) {
    hawtio.setBasePath(basepath)
  }

  return (
    <MemoryRouter initialEntries={[hawtio.getBasePath() ?? '/']}>
      <Switch>
        <Route path={hawtio.fullPath(LOGIN)}><HawtioLogin /></Route>
        <Route exact path={hawtio.fullPath(INDEX)}><HawtioPage /></Route>
        <Route path={hawtio.fullPath(WILDCARD)}><HawtioPage /></Route>
      </Switch>
    </MemoryRouter>
  )
}
