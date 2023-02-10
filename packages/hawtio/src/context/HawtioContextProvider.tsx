import { createContext } from 'react'
import { initialState } from './context'

export const HawtioContext = createContext(initialState)

type Props = {
  children: React.ReactNode
}

export const HawtioContextProvider: React.FunctionComponent<Props> = ({ children }) => {
  return <HawtioContext.Provider value={initialState}>{children}</HawtioContext.Provider>
}
