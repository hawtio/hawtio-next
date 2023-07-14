import { MBeanTree } from '@hawtiosrc/plugins/shared/tree'
import { workspace } from './workspace'

jest.mock('@hawtiosrc/plugins/shared/jolokia-service')

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
    await expect(workspace.treeContainsDomainAndProperties('quartz')).resolves.toBeTruthy()
  })

  test('tree does not contain domain', async () => {
    await expect(workspace.treeContainsDomainAndProperties('not.a.domain')).resolves.toBeFalsy()
  })

  test('tree contains domain with properties', async () => {
    await expect(
      workspace.treeContainsDomainAndProperties('quartz', { id: 'quartz', name: 'quartz' }),
    ).resolves.toBeTruthy()
    await expect(
      workspace.treeContainsDomainAndProperties('quartz', {
        id: 'quartz-folder-QuartzScheduler',
        name: 'QuartzScheduler',
      }),
    ).resolves.toBeTruthy()
    await expect(
      workspace.treeContainsDomainAndProperties('quartz', { id: 'SomeRandomChild', name: 'NoThisChildIsNotHere' }),
    ).resolves.toBeFalsy()
  })

  test('parseMBean', () => {
    const testdata = [
      { mbean: 'jolokia:type=Config', expected: { attributes: { type: 'Config' }, domain: 'jolokia' } },
      {
        mbean: 'jdk.management.jfr:type=FlightRecorder',
        expected: { attributes: { type: 'FlightRecorder' }, domain: 'jdk.management.jfr' },
      },
      {
        mbean: 'jboss.threads:name="XNIO-1",type=thread-pool',
        expected: { attributes: { name: '"XNIO-1"', type: 'thread-pool' }, domain: 'jboss.threads' },
      },
      {
        mbean: 'org.apache.camel:context=SampleCamelLog4J,type=context,name="SampleCamelLog4J"',
        expected: {
          attributes: { context: 'SampleCamelLog4J', name: '"SampleCamelLog4J"', type: 'context' },
          domain: 'org.apache.camel',
        },
      },
    ]

    for (const test of testdata) {
      expect(workspace.parseMBean(test.mbean)).toEqual(test.expected)
    }
  })
})
