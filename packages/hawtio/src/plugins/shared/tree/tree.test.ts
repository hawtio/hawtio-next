import { escapeHtmlId } from '@hawtiosrc/util/jolokia'
import { workspace } from '../workspace'
import { MBeanNode } from './node'
import { treeProcessorRegistry } from './processor-registry'
import { MBeanTree } from './tree'

jest.mock('@hawtiosrc/plugins/connect/jolokia-service')

describe('MBeanTree', () => {
  let wkspTree: MBeanTree

  beforeEach(async () => {
    wkspTree = await workspace.getTree()
    workspace.refreshTree()
    treeProcessorRegistry.reset()
  })

  test('flatten empty tree', async () => {
    const tree = MBeanTree.createFromNodes('test', [])
    expect(tree.flatten()).toEqual({})
  })

  test('flatten tree', async () => {
    const child1 = createNode('child1', 'test:type=folder1,name=child1')
    const child2 = createNode('child2', 'test:type=folder1,name=child2')
    const child3 = createNode('child3', 'test:type=folder1,name=child3')
    const folder1 = createFolder('folder1', [child1, child2, child3])
    const node1 = createNode('node1', 'test:name=node1')
    const node2 = createNode('node2', 'test:name=node2')
    const tree = MBeanTree.createFromNodes('test', [folder1, node1, node2])

    expect(tree.flatten()).toEqual({
      'test:type=folder1,name=child1': child1,
      'test:type=folder1,name=child2': child2,
      'test:type=folder1,name=child3': child3,
      'test:name=node1': node1,
      'test:name=node2': node2,
    })
  })

  test('navigate', async () => {
    let path = ['org.apache.camel', 'SampleCamel', 'components', 'quartz']
    let qNode = wkspTree.navigate(...path) as MBeanNode
    expect(qNode).not.toBeNull()
    expect(qNode.id).toBe('org.apache.camel-folder-SampleCamel-folder-components-folder-quartz')

    path = ['org.apache.camel', 'SampleCame*', 'c*ponents', '*artz']
    qNode = wkspTree.navigate(...path) as MBeanNode
    expect(qNode).not.toBeNull()
    expect(qNode.id).toBe('org.apache.camel-folder-SampleCamel-folder-components-folder-quartz')
  })

  test('forEach', async () => {
    let path = ['org.apache.camel', 'SampleCamel', 'components', 'quartz']
    let counter = 0
    wkspTree.forEach(path, _ => (counter = counter + 1))
    expect(counter).toEqual(path.length)

    path = ['org.apache.camel', 'SampleCame*', 'c*ponents', '*artz']
    counter = 0
    wkspTree.forEach(path, _ => (counter = counter + 1))
    expect(counter).toEqual(path.length)
  })

  test('IDs should be concatenation of {parent}[-folder]-({element}[-folder]) on domain tree', async () => {
    const allNodes: MBeanNode[] = []
    const recursivelyGetAllNodesOnTree = (tree: MBeanNode[]) => {
      tree.forEach((node: MBeanNode) => {
        allNodes.push(node)
        recursivelyGetAllNodesOnTree(node.getChildren())
      })
    }
    const getExpectedIdRecursivelyFromParentNode = (node: MBeanNode): string => {
      //Can't access node.idSeparator as is private. And in any case, we should modify this whenever it changes
      const idSeparator = '-'
      const folderDenomination = '-folder'
      const currentNodeExpectedPartOfId = escapeHtmlId(node.name) +
        (node.getChildren().length !== 0 ? folderDenomination : '')

      if (!node.parent) return currentNodeExpectedPartOfId
      return getExpectedIdRecursivelyFromParentNode(node.parent) + idSeparator + currentNodeExpectedPartOfId
    }
    recursivelyGetAllNodesOnTree(wkspTree.getTree())

    allNodes.forEach(node => {
      expect(node.id).toEqual(getExpectedIdRecursivelyFromParentNode(node))
    })
  })

  test('IDs should be concatenation of {parent}[-folder]-({element}[-folder]) on mock tree', () => {
    //The object names are dummys because they are not used for the ids.
    const treeNodes = [
      createFolder('mbean1', [
        createFolder('mbean1-1', [
          createFolder('mbean1-1-1', [
            createNode('mbean1-1-1-1', 'objectName1-1-1-1'),
            createNode('mbean1-1-1-2', 'objectName1-1-1-2'),
          ]),
          createNode('mbean1-1-2', 'objectName1-1-2'),
          createNode('mbean1-1-3', 'objectName1-1-3'),
        ]),
        createNode('mbean1-2', 'objectName1-2'),
        createFolder('mbean1-3', [createNode('mbean1-3-1', 'objectName1-3-1')]),
      ]),
      createFolder('mbean2', [createNode('mbean2-1', 'objectName2-1'), createNode('mbean2-2', 'objectName2-2')]),
      createNode('mbean3', 'objectName3'),
    ]

    const pathToExpectedIds = [
      {
        path: ['mbean1'],
        expectedId: 'mbean1-folder',
      },
      {
        path: ['mbean1', 'mbean1-1'],
        expectedId: 'mbean1-folder-mbean1-1-folder',
      },
      {
        path: ['mbean1', 'mbean1-1', 'mbean1-1-1'],
        expectedId: 'mbean1-folder-mbean1-1-folder-mbean1-1-1-folder',
      },
      {
        path: ['mbean1', 'mbean1-1', 'mbean1-1-1', 'mbean1-1-1-1'],
        expectedId: 'mbean1-folder-mbean1-1-folder-mbean1-1-1-folder-mbean1-1-1-1',
      },
      {
        path: ['mbean1', 'mbean1-1', 'mbean1-1-1', 'mbean1-1-1-2'],
        expectedId: 'mbean1-folder-mbean1-1-folder-mbean1-1-1-folder-mbean1-1-1-2',
      },
      {
        path: ['mbean1', 'mbean1-1', 'mbean1-1-2'],
        expectedId: 'mbean1-folder-mbean1-1-folder-mbean1-1-2',
      },
      {
        path: ['mbean1', 'mbean1-1', 'mbean1-1-3'],
        expectedId: 'mbean1-folder-mbean1-1-folder-mbean1-1-3',
      },
      {
        path: ['mbean1', 'mbean1-2'],
        expectedId: 'mbean1-folder-mbean1-2',
      },
      {
        path: ['mbean1', 'mbean1-3'],
        expectedId: 'mbean1-folder-mbean1-3-folder',
      },
      {
        path: ['mbean1', 'mbean1-3', 'mbean1-3-1'],
        expectedId: 'mbean1-folder-mbean1-3-folder-mbean1-3-1',
      },
      {
        path: ['mbean2'],
        expectedId: 'mbean2-folder',
      },
      {
        path: ['mbean2', 'mbean2-1'],
        expectedId: 'mbean2-folder-mbean2-1',
      },
      {
        path: ['mbean2', 'mbean2-2'],
        expectedId: 'mbean2-folder-mbean2-2',
      },
      {
        path: ['mbean3'],
        expectedId: 'mbean3',
      },
    ]

    const tree = MBeanTree.createFromNodes('thisIdIsNotUsedForMBeanIds', treeNodes)

    pathToExpectedIds.forEach(({ path, expectedId }) => {
      expect(tree.navigate(...path)?.id).toEqual(expectedId)
    })
  })
})

function createNode(name: string, objectName: string): MBeanNode {
  const node = new MBeanNode(null, name, false)
  node.objectName = objectName
  node.initId(false)
  return node
}

function createFolder(name: string, children: MBeanNode[]): MBeanNode {
  const folder = new MBeanNode(null, name, true)
  children.forEach(child => folder.adopt(child))
  folder.initId(true)
  return folder
}
