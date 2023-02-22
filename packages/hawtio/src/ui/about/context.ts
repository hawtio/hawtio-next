import { About, configManager } from '@hawtiosrc/core'
import { useEffect, useState } from 'react'

/**
 * Custom React hook for using Hawtio About.
 */
export function useAbout() {
  const [about, setAbout] = useState<About>({})
  const [aboutLoaded, setAboutLoaded] = useState(false)

  useEffect(() => {
    const loadAbout = async () => {
      const config = await configManager.getHawtconfig()
      if (config.about) {
        setAbout(config.about)
      }
      setAboutLoaded(true)
    }
    loadAbout()
  }, [])

  return { about, aboutLoaded }
}
