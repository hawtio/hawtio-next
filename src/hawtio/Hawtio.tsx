import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import './Hawtio.css'
import { HawtioPage } from './ui/page/HawtioPage'

export const Hawtio: React.FunctionComponent = () =>
  <BrowserRouter>
    <HawtioPage />
  </BrowserRouter>
