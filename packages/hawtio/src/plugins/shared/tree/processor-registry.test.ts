import { MBeanNode } from './node'
import { treeProcessorRegistry } from './processor-registry'

describe('treeProcessorRegistry', () => {
  beforeEach(() => {
    treeProcessorRegistry.reset()
  })

  test('add processors to a domain', async () => {
    expect(treeProcessorRegistry).not.toBeNull()
    expect(treeProcessorRegistry.getProcessors()).toEqual({})

    const node = new MBeanNode('test', 'test-id', 'Test Node', true)

    // Processing without processors should not throw an error
    expect(() => treeProcessorRegistry.process('test', node)).not.toThrowError()

    // Add a processor to a domain
    const testProcessor1 = jest.fn()

    treeProcessorRegistry.add('test', testProcessor1)
    expect(treeProcessorRegistry.getProcessors()['test']).toHaveLength(1)
    treeProcessorRegistry.process('test', node)
    expect(testProcessor1.mock.calls).toHaveLength(1)

    // Add additional processor to same domain
    const testProcessor2 = jest.fn()
    treeProcessorRegistry.add('test', testProcessor2)

    expect(treeProcessorRegistry.getProcessors()['test']).toHaveLength(2)
    treeProcessorRegistry.process('test', node)
    expect(testProcessor1.mock.calls).toHaveLength(2)
    expect(testProcessor2.mock.calls).toHaveLength(1)
  })
})
