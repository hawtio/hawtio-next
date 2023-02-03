import { connectService } from './connect-service'
import { log, proxyEnabledPath } from './globals'

export async function isActive(): Promise<boolean> {
  const proxyEnabled = await isProxyEnabled()
  if (!proxyEnabled) {
    return false
  }

  return connectService.getCurrentConnection() === null
}

async function isProxyEnabled(): Promise<boolean> {
  try {
    const res = await fetch(proxyEnabledPath)
    const data = await res.text()

    // Disable proxy only when explicitly disabled
    const enabled = data.trim() !== 'false'
    log.debug('Proxy enabled:', enabled)
    return enabled
  } catch (err) {
    // Silently ignore and enable it when the path is not available
    log.debug('Failed to fetch', proxyEnabledPath, ':', err)
    return true
  }
}
