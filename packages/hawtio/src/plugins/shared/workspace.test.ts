import { workspace } from './workspace'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { jolokiaService } from '@hawtio/plugins/connect/jolokia-service'
import { MBeanTree } from '@hawtio/plugins/shared/tree'

jest.mock('@hawtio/plugins/connect/jolokia-service')

describe('workspace', () => {

  test('getting the tree', async () => {

    const tree: MBeanTree = await workspace.getTree()
    expect(tree.isEmpty()).toBeFalsy()
    expect(tree.get('java.util.logging')).toBeDefined()
    expect(tree.get('quartz')).toBeDefined()
    expect(tree.get('org.apache.camel')).toBeDefined()
  })

  test('has mbeans', async () => {
    const response: boolean = await workspace.hasMBeans()
    expect(response).toBeTruthy()
  })

  test('tree contains domain', async () => {
    expect(workspace.treeContainsDomainAndProperties('quartz')).resolves.toBeTruthy()
  })

  test('tree does not contain domain', async () => {
    expect(workspace.treeContainsDomainAndProperties('not.a.domain')).resolves.toBeFalsy()
  })

  test('tree contains domain with properties', async () => {
    expect(workspace.treeContainsDomainAndProperties('quartz', {id: 'quartz', name: 'quartz'})).resolves.toBeTruthy()
    expect(workspace.treeContainsDomainAndProperties('quartz', {id: 'QuartzScheduler', name: 'QuartzScheduler'})).resolves.toBeTruthy()
    expect(workspace.treeContainsDomainAndProperties('quartz', {id: 'SomeRandomChild', name: 'NoThisChildIsNotHere'})).resolves.toBeFalsy()
  })
})
