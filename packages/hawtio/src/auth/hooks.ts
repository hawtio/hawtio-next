import { useEffect, useState } from 'react'
import { userService } from './user-service'

/**
 * Custom React hook for using Hawtio users.
 */
export function useUser() {
  const [username, setUsername] = useState('')
  const [isLogin, setIsLogin] = useState(false)
  const [userLoaded, setUserLoaded] = useState(false)
  // special, temporary status of user fetching operation. Required to avoid flickering when OAuth2
  // redirect login is pending
  const [userLoading, setUserLoading] = useState(true)

  useEffect(() => {
    let proceed = true
    const isProceed = () => proceed
    const fetchUser = async () => {
      // Try syncing the login status with the server here
      await userService.fetchUser(true, () => isProceed())

      const username = await userService.getUsername()
      const isLogin = await userService.isLogin()
      const isLoading = await userService.isLoading()
      if (isProceed()) {
        setUsername(username)
        setIsLogin(isLogin)
        setUserLoading(isLoading)
        setUserLoaded(true)
      }
    }
    fetchUser()

    return () => {
      proceed = false
    }
  }, [])

  return { username, isLogin, userLoaded, userLoading }
}
