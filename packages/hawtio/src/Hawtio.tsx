import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { hawtio } from './core'
import './Hawtio.css'
import { HawtioLogin } from './ui/login'
import { HawtioPage } from './ui/page'

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
      <Routes>
        <Route path='/login' element={<HawtioLogin />} />
        <Route path='/*' element={<HawtioPage />} />
      </Routes>
    </BrowserRouter>
  )
}
