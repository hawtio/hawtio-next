import { userService } from '@hawtiosrc/auth/user-service'
import { connectService } from '@hawtiosrc/plugins/shared/connect-service'
import { log, PATH_PROXY_ENABLED } from './globals'
import { configManager, TaskState } from '@hawtiosrc/core'

export async function isActive(): Promise<boolean> {
  const proxyEnabled = await isProxyEnabled()
  if (!proxyEnabled) {
    return false
  }

  // The connect login path is exceptionally allowlisted to provide login form for
  // remote Jolokia endpoints requiring authentication.
  return connectService.getCurrentConnectionId() === null || isConnectLogin()
}

export async function isConnectionStatusActive(): Promise<boolean> {
  const proxyEnabled = await isProxyEnabled()
  if (!proxyEnabled) {
    return false
  }

  // for "main" hawtio page, where this plugin is fully active, we don't have to show the connection status
  // but for actually connected tab, we want the status in the header
  return connectService.getCurrentConnectionId() !== null
}

let proxyEnabled: boolean | null = null

async function isProxyEnabled(): Promise<boolean> {
  if (proxyEnabled != null) {
    return proxyEnabled
  }

  try {
    configManager.initItem("Checking proxy", TaskState.started, "config")
    const res = await fetch(PATH_PROXY_ENABLED)
    if (!res.ok) {
      configManager.initItem("Checking proxy", TaskState.skipped, "config")
      log.debug('Failed to fetch', PATH_PROXY_ENABLED, ':', res.status, res.statusText)
      return false
    }

    const data = await res.text()
    // Disable proxy only when explicitly disabled
    proxyEnabled = data.trim() !== 'false'
    configManager.initItem("Checking proxy", proxyEnabled ? TaskState.finished : TaskState.skipped, "config")
    log.debug('Proxy enabled:', proxyEnabled)
  } catch (err) {
    // Silently ignore and enable it when the path is not available
    configManager.initItem("Checking proxy", TaskState.skipped, "config")
    log.debug('Failed to fetch', PATH_PROXY_ENABLED, ':', err)
    proxyEnabled = false
  }

  return proxyEnabled
}

function isConnectLogin(): boolean {
  const url = new URL(window.location.href)
  return url.pathname === connectService.getLoginPath()
}

/**
 * Register user hooks to userService if it's connecting to an authenticated
 * remote Jolokia endpoint with credentials in session storage, so that the user
 * can reflect the remote credentials.
 */
export function registerUserHooks() {
  const credPromise = connectService.getCurrentCredentials()

  // no fetchUserHook - remote Jolokia credentials are not Hawtio credentials

  userService.addLogoutHook('connect', async () => {
    const credentials = await credPromise
    if (!credentials) {
      return false
    }
    // Logout from remote connection should close the window
    window.close()
    return true
  })
}
