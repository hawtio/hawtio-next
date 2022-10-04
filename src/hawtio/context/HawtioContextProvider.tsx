import { createContext } from 'react'
import { initialState } from './context'

export const HawtioContext = createContext(initialState)

export const HawtioContextProvider: React.FunctionComponent = ({ children }) => {
  return (
    <HawtioContext.Provider value={initialState}>
      {children}
    </HawtioContext.Provider>
  )
}
