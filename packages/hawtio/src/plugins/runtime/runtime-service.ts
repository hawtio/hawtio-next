import { jolokiaService } from '@hawtiosrc/plugins/shared'

export type SystemProperty = { key: string; value: string }

export function getSystemProperties(): Promise<SystemProperty[]> {
  const systemProperties: SystemProperty[] = []
  return jolokiaService.readAttribute('java.lang:type=Runtime', 'SystemProperties').then(attr => {
    for (const [k, v] of Object.entries(attr as object)) {
      systemProperties.push({ key: k, value: v })
    }
    return systemProperties
  })
}
