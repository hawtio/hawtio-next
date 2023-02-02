import { hawtio } from '@hawtio/core'
import { helpRegistry } from '@hawtio/help/registry'
import { preferencesRegistry } from '@hawtio/preferences/registry'
import { isString } from '@hawtio/util/strings'
import $ from 'jquery'
import { Connect } from './Connect'
import { ConnectPreferences } from './ConnectPreferences'
import { log, proxyEnabledPath } from './globals'
import help from './help.md'
import { jolokiaService } from './jolokia-service'

export const connect = () => {
  hawtio.addPlugin({
    id: 'connect',
    title: 'Connect',
    path: '/connect',
    component: Connect,
    isActive: isActive,
  })
  helpRegistry.add('connect', 'Connect', help, 11)
  preferencesRegistry.add('connect', 'Connect', ConnectPreferences, 11)
}

async function isActive(): Promise<boolean> {
  const proxyEnabled = await isProxyEnabled()
  if (!proxyEnabled) {
    return false
  }

  const jolokiaUrl = await jolokiaService.getJolokiaUrl()
  return jolokiaUrl === null
}

async function isProxyEnabled(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    $.ajax(proxyEnabledPath)
      .done((data: unknown) => {
        // Disable proxy only when explicitly disabled
        if (!isString(data)) {
          resolve(true)
          return
        }
        const enabled = data.trim() !== 'false'
        log.debug('Proxy enabled:', enabled)
        resolve(enabled)
      })
      .fail((xhr: JQueryXHR) => {
        // Silently ignore and enable it when the path is not available
        log.debug('Failed to fetch', proxyEnabledPath, ':', xhr.status, xhr.statusText)
        resolve(true)
      })
  })
}
