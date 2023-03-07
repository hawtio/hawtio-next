import { Icons, MBeanNode, PropertyList } from './node'

describe('MBeanNode', () => {
  test('populateMBean', () => {
    const mbean = {
      desc: 'Managed CamelContext',
      attr: {
        CamelId: {
          rw: false,
          type: 'java.lang.String',
          desc: 'Camel ID',
        },
        CamelVersion: {
          rw: false,
          type: 'java.lang.String',
          desc: 'Camel Version',
        },
        ExchangesTotal: {
          rw: false,
          type: 'long',
          desc: 'Total number of exchanges',
        },
        Redeliveries: {
          rw: false,
          type: 'long',
          desc: 'Number of redeliveries (internal only)',
        },
      },
      op: {
        getCamelId: {
          args: [],
          ret: 'java.lang.String',
          desc: 'CamelId',
        },
        start: {
          args: [],
          ret: 'void',
          desc: 'Start Camel',
        },
        stop: {
          args: [],
          ret: 'void',
          desc: 'Stop Camel (shutdown)',
        },
        sendBody: {
          args: [
            {
              name: 'p1',
              type: 'java.lang.String',
              desc: '',
            },
            {
              name: 'p2',
              type: 'java.lang.Object',
              desc: '',
            },
          ],
          ret: 'void',
          desc: 'Send body (in only)',
        },
      },
      canInvoke: true,
    }

    const node1 = new MBeanNode('test', 'test.node', 'test.node', false)
    node1.populateMBean('context=SampleContext,type=context,name="SampleCamel"', mbean)
    expect(node1.icon).toBe(Icons.folder)
    expect(node1.expandedIcon).toBe(Icons.folderOpen)
    expect(node1.children).toHaveLength(1)

    let child1 = node1.children?.[0]
    expect(child1?.name).toEqual('SampleContext')
    expect(child1?.icon).toBe(Icons.folder)
    expect(child1?.expandedIcon).toBe(Icons.folderOpen)
    expect(child1?.children).toHaveLength(1)

    child1 = child1?.children?.[0]
    expect(child1?.name).toEqual('context')
    expect(child1?.icon).toBe(Icons.folder)
    expect(child1?.expandedIcon).toBe(Icons.folderOpen)
    expect(child1?.children).toHaveLength(1)

    child1 = child1?.children?.[0]
    expect(child1?.name).toEqual('SampleCamel')
    expect(child1?.mbean).toBe(mbean)
    expect(child1?.icon).toBe(Icons.mbean)
    expect(child1?.expandedIcon).toBeUndefined()
    expect(child1?.children).toBeUndefined()

    // When canInvoke is false
    mbean.canInvoke = false
    const node2 = new MBeanNode('test', 'test.node', 'test.node', false)
    node2.populateMBean('context=SampleContext,type=context,name="SampleCamel"', mbean)

    const child2 = node2.children?.[0].children?.[0].children?.[0]
    expect(child2?.name).toEqual('SampleCamel')
    expect(child2?.mbean).toBe(mbean)
    expect(child2?.icon).toBe(Icons.locked)
    expect(child2?.expandedIcon).toBeUndefined()
    expect(child2?.children).toBeUndefined()
  })
})

describe('PropertyList', () => {
  test('objectName', () => {
    const node = new MBeanNode('test', 'org.apache.camel', 'org.apache.camel', false)
    const propList = new PropertyList(node, 'context=SampleContext,type=context,name="SampleCamel"')
    expect(propList.objectName()).toEqual('org.apache.camel:context=SampleContext,type=context,name="SampleCamel"')
  })

  test('getPaths', () => {
    const node1 = new MBeanNode('test', 'java.lang', 'java.lang', false)
    const propList1 = new PropertyList(node1, 'name=Metaspace,type=MemoryPool')
    expect(propList1.getPaths()).toEqual(['MemoryPool', 'Metaspace'])

    const node2 = new MBeanNode('test', 'org.apache.camel', 'org.apache.camel', false)
    const propList2 = new PropertyList(node2, 'context=SampleContext,type=context,name="SampleCamel"')
    expect(propList2.getPaths()).toEqual(['SampleContext', 'context', 'SampleCamel'])
  })

  test('getPaths for special domains', () => {
    // osgi.compendium
    const osgiCompendiumNode = new MBeanNode('test', 'osgi.compendium', 'osgi.compendium', false)
    const osgiCompendiumPropList = new PropertyList(
      osgiCompendiumNode,
      'name=Name1,framework=Framework1,service=Service1,version=Version1',
    )
    expect(osgiCompendiumPropList.getPaths()).toEqual(['Service1', 'Version1', 'Framework1', 'Name1'])

    // osgi.core
    const osgiCoreNode = new MBeanNode('test', 'osgi.core', 'osgi.core', false)
    const osgiCorePropList = new PropertyList(
      osgiCoreNode,
      'name=Name1,framework=Framework1,type=Type1,version=Version1',
    )
    expect(osgiCorePropList.getPaths()).toEqual(['Type1', 'Version1', 'Framework1', 'Name1'])
  })
})
