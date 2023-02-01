import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { HawtioContextProvider } from './context'
import './Hawtio.css'
import { HawtioPage } from './ui/page/HawtioPage'

export type HawtioProps = {
  basepath: string
}

export const Hawtio: React.FunctionComponent<HawtioProps> = props => {
  const { basepath } = props
  return (
    <HawtioContextProvider>
      <BrowserRouter basename={basepath}>
        <HawtioPage />
      </BrowserRouter>
    </HawtioContextProvider>
  )
}
