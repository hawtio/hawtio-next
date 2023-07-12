import { helpRegistry } from './registry'

describe('helpRegistry', () => {
  beforeEach(() => {
    helpRegistry.reset()
  })

  test('add a help', async () => {
    const payload = `
      # Help Test
      Test help content.
    `

    expect(helpRegistry).not.toBeNull()
    expect(helpRegistry.getHelps()).toEqual([])
    helpRegistry.add('test', 'Test', payload)
    expect(helpRegistry.getHelps()).toHaveLength(1)
    expect(helpRegistry.getHelps()[0]?.id).toEqual('test')
    expect(helpRegistry.getHelps()[0]?.title).toEqual('Test')
    expect(helpRegistry.getHelps()[0]?.content).toEqual(`
      # Help Test
      Test help content.
    `)

    // duplicate help not allowed
    expect(() => helpRegistry.add('test', 'Test', payload)).toThrowError(/Help 'test' already registered/)
  })

  test('return helps in order', async () => {
    expect(helpRegistry).not.toBeNull()
    expect(helpRegistry.getHelps()).toEqual([])

    helpRegistry.add('id3', 'Help3', 'Help content', 3)
    helpRegistry.add('id1', 'Help1', 'Help content', 1)
    helpRegistry.add('id2', 'Help2', 'Help content', 2)

    expect(helpRegistry.getHelps()).toHaveLength(3)
    expect(helpRegistry.getHelps().map(h => h.id)).toEqual(['id1', 'id2', 'id3'])
  })
})
