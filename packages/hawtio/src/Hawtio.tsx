import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { HawtioContextProvider } from './context'
import './Hawtio.css'
import { HawtioPage } from './ui/page/HawtioPage'

export const Hawtio: React.FunctionComponent = () =>
  <HawtioContextProvider>
    <BrowserRouter>
      <HawtioPage />
    </BrowserRouter>
  </HawtioContextProvider>
