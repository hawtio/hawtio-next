import { SystemProperty } from '@hawtiosrc/plugins/runtime/types'
import { jolokiaService } from '@hawtiosrc/plugins'

export async function loadHealth() {
  const attr = await jolokiaService.execute('org.springframework.boot:type=Endpoint,name=Health', 'health')
  console.log(attr)
  // for (const [k, v] of Object.entries(attr as object)) {
  //   systemProperties.push({ key: k, value: v })
  // }
  //return systemProperties
}
