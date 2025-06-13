import { Plugin } from '@hawtiosrc/core'
import { createContext } from 'react'

export type PageContext = {
  username: string
  plugins: Plugin[]
}

/**
 * PageContext gives access to:
 * * login name of currently logged in user
 * * an array of plugins available in Hawtio - to be displayed in `<HawtioSidebar>`
 *
 * This context is _provided_ in top level `<HawtioPage>` component and provides read-only information
 * about current username and a list of loaded plugins.
 * The state is managed in `useUser` and `usePlugins` hooks.
 */
export const PageContext = createContext<PageContext>({
  username: '',
  plugins: [],
})
