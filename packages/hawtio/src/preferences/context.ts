import { ChildLogger, Logger } from '@hawtiosrc/core'
import { createContext, useState } from 'react'

/**
 * Custom React hook for child loggers.
 */
export function useChildLoggers() {
  const [childLoggers, setChildLoggers] = useState(Logger.getChildLoggers())
  const [availableChildLoggers, setAvailableChildLoggers] = useState(Logger.getAvailableChildLoggers())

  const reloadChildLoggers = () => {
    setChildLoggers(Logger.getChildLoggers())
    setAvailableChildLoggers(Logger.getAvailableChildLoggers())
  }

  return { childLoggers, setChildLoggers, availableChildLoggers, setAvailableChildLoggers, reloadChildLoggers }
}

type LogsContext = {
  childLoggers: ChildLogger[]
  availableChildLoggers: ChildLogger[]
  reloadChildLoggers: () => void
}

export const LogsContext = createContext<LogsContext>({
  childLoggers: [],
  availableChildLoggers: [],
  reloadChildLoggers: () => {
    /* no-op */
  },
})
