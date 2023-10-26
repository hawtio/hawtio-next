import { connectService } from '@hawtiosrc/plugins/shared/connect-service'
import { log, PATH_PROXY_ENABLED } from './globals'

export async function isActive(): Promise<boolean> {
  const proxyEnabled = await isProxyEnabled()
  if (!proxyEnabled) {
    return false
  }

  // The connect login path is exceptionally allowlisted to provide login form for
  // remote Jolokia endpoints requiring authentication.
  return connectService.getCurrentConnectionName() === null || isConnectLogin()
}

async function isProxyEnabled(): Promise<boolean> {
  try {
    const res = await fetch(PATH_PROXY_ENABLED)
    if (!res.ok) {
      // Silently ignore and enable it when fetch failed
      log.debug('Failed to fetch', PATH_PROXY_ENABLED, ':', res.status, res.statusText)
      return true
    }

    const data = await res.text()
    // Disable proxy only when explicitly disabled
    const enabled = data.trim() !== 'false'
    log.debug('Proxy enabled:', enabled)
    return enabled
  } catch (err) {
    // Silently ignore and enable it when the path is not available
    log.debug('Failed to fetch', PATH_PROXY_ENABLED, ':', err)
    return true
  }
}

function isConnectLogin(): boolean {
  const url = new URL(window.location.href)
  return url.pathname === connectService.getLoginPath()
}
