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
 * * a state for a flag indicating failed login attempt
 * * a state for a flag indicating error message if there was a login error
 * * a state for a flag indicating userService finished its async operation (user retrieval)
 * * a state for selected login method - dependening on which plugin successfuly fetched the user
 * * an effect that synchronizes with `userService` to alter the state
 *
 * This hook synchronizes with information retrieved from `userService` (which in turn may use auth hooks).
 */
export function useUser() {
  const [username, setUsername] = useState('')
  const [isLogin, setIsLogin] = useState(false)
  const [isLoginError, setIsLoginError] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [userLoaded, setUserLoaded] = useState(false)
  const [loginMethod, setLoginMethod] = useState('')

  useEffect(() => {
    let proceed = true
    const isProceed = () => proceed
    const fetchUser = async () => {
      // Try syncing the login status with the server here
      await userService.fetchUser(configManager.authRetry, () => isProceed())

      const loginMethod = await userService.getLoginMethod()
      const isLoginError = await userService.isLoginError()
      const loginError = isLoginError ? await userService.loginError() : ''
      // check username only if there's no error - userService resolves `user` promise only once
      const username = isLoginError ? '' : await userService.getUsername()
      const isLogin = isLoginError ? false : await userService.isLogin()
      if (isProceed()) {
        setUsername(username ?? '')
        setIsLogin(isLogin)
        setIsLoginError(isLoginError)
        setLoginMethod(loginMethod)
        setLoginError(loginError!)
        setUserLoaded(true)
      }
    }
    fetchUser()

    return () => {
      proceed = false
    }
  }, [])

  return { username, isLogin, userLoaded, loginMethod, isLoginError, loginError }
}
