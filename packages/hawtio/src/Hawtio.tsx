import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { hawtio } from './core'
import './Hawtio.css'
import { HawtioPage } from './ui/page/HawtioPage'

export type HawtioProps = {
  basepath?: string
}

export const Hawtio: React.FunctionComponent<HawtioProps> = props => {
  const { basepath } = props

  if (basepath) {
    hawtio.setBasePath(basepath)
  }

  return (
    <BrowserRouter basename={hawtio.getBasePath()}>
      <HawtioPage />
    </BrowserRouter>
  )
}
