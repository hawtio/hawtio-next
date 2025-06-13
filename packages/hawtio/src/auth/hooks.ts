import { useEffect, useState } from 'react'
import { userService } from './user-service'
import { configManager } from '@hawtiosrc/core'

/**
 * Custom React hook for accessing information about currently logged in user and
 * information about user loading process state.
 *
 * This hook holds:
 * * a state for user name
 * * a state for a flag indicating user is correctly logged in (is not a guest/public user)
 * * a state for a flag indicating userService finished its async operation (user retrieval)
 * * an effect that synchronizes with `userService` to alter the state
 *
 * This hook synchronizes with information retrieved from `userService` (which in turn may use auth hooks).
 */
export function useUser() {
  const [username, setUsername] = useState('')
  const [isLogin, setIsLogin] = useState(false)
  const [userLoaded, setUserLoaded] = useState(false)

  useEffect(() => {
    let proceed = true
    const isProceed = () => proceed
    const fetchUser = async () => {
      // Try syncing the login status with the server here
      await userService.fetchUser(configManager.authRetry, () => isProceed())

      const username = await userService.getUsername()
      const isLogin = await userService.isLogin()
      if (isProceed()) {
        setUsername(username)
        setIsLogin(isLogin)
        setUserLoaded(true)
      }
    }
    fetchUser().then(() => true)

    return () => {
      proceed = false
    }
  }, [])

  return { username, isLogin, userLoaded }
}
