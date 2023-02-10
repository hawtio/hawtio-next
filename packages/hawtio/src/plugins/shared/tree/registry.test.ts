import { treeProcessorRegistry, Domain } from './registry'
import { MBeanNode } from './node'

describe('treeProcessorRegistry', () => {
  beforeEach(() => {
    treeProcessorRegistry.reset()
  })

  test('add a domain processor', async () => {
    expect(treeProcessorRegistry).not.toBeNull()
    expect(treeProcessorRegistry.getDomains()).toEqual([])

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const testProcessor = (domainNode: MBeanNode) => {
      console.log('Nothing to do')
    }

    treeProcessorRegistry.add('test', testProcessor)
    let domains: Domain[] = treeProcessorRegistry.getDomains()
    expect(domains).toHaveLength(1)
    expect(treeProcessorRegistry.getProcessors('test')).toContain(testProcessor)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const testProcessor2 = (domainNode: MBeanNode) => {
      console.log('Nothing to do')
    }

    // Add additional processor to same domain
    treeProcessorRegistry.add('test', testProcessor2)

    domains = treeProcessorRegistry.getDomains()
    expect(domains).toHaveLength(1)
    expect(treeProcessorRegistry.getProcessors('test')).toContain(testProcessor)
    expect(treeProcessorRegistry.getProcessors('test')).toContain(testProcessor2)
  })
})
