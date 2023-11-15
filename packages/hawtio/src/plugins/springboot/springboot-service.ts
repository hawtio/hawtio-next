import { jolokiaService, workspace } from '@hawtiosrc/plugins'
import { HealthComponent, HealthData, JolokiaHealthData } from './types'

export async function loadHealth(): Promise<HealthData> {
  const data = (await jolokiaService.execute(
    'org.springframework.boot:type=Endpoint,name=Health',
    'health',
  )) as JolokiaHealthData
  let healthComponents: HealthComponent[] = []

  healthComponents = Object.entries(data.components).map(([componentName, component]) => {
    let details

    if (component.details) {
      details = Object.entries(component.details).map(([detailKey, detailValue]) => {
        const typ = typeof detailValue
        const value = ['string', 'number', 'boolean'].includes(typ)
          ? detailValue.toString()
          : Object.entries(detailValue).map(([key, value]) => ({ key, value }))

        return {
          key: detailKey,
          value: value,
        }
      })
    }

    return {
      name: componentName,
      status: component.status,
      details: component.details ? details : undefined,
    }
  })

  return { status: data.status, components: healthComponents }
}

export async function getInfo() {
  const res = await jolokiaService.execute('org.springframework.boot:type=Endpoint,name=Info', 'info')
  const properties: { key: string; value: string }[] = Object.entries(res as object).map(([key, value]) => ({
    key,
    value,
  }))
  return properties
}

export async function hasEndpoint(name: string): Promise<boolean> {
  return await workspace.treeContainsDomainAndProperties('org.springframework.boot', { type: 'Endpoint', name: name })
}
