import { Plugin } from '@hawtiosrc/core'
import { createContext } from 'react'

export type PageContext = {
  username: string
  plugins: Plugin[]
}

export const PageContext = createContext<PageContext>({
  username: '',
  plugins: [],
})
