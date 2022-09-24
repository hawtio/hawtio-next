import helpRegistry from './registry'
import { jest } from '@jest/globals'

describe('helpRegistry', () => {
  beforeEach(() => helpRegistry.reset())

  test('add a help', async () => {
    global.fetch = jest.fn(() => Promise.resolve(new Response(`
      # Help Test
      Test help content.
    `)))

    expect(helpRegistry).not.toBeNull()
    expect(helpRegistry.getHelps()).toEqual([])
    await helpRegistry.add('test', 'Test', './help.md', 1)
    expect(helpRegistry.getHelps()).toHaveLength(1)
    expect(helpRegistry.getHelps()[0].id).toEqual('test')
    expect(helpRegistry.getHelps()[0].title).toEqual('Test')
    expect(helpRegistry.getHelps()[0].content).toEqual(`
      # Help Test
      Test help content.
    `)
  })

  test('return helps in order', async () => {
    global.fetch = jest.fn(() => Promise.resolve(new Response('')))

    expect(helpRegistry).not.toBeNull()
    expect(helpRegistry.getHelps()).toEqual([])

    await helpRegistry.add('id3', 'Help3', './help.md', 3)
    await helpRegistry.add('id1', 'Help1', './help.md', 1)
    await helpRegistry.add('id2', 'Help2', './help.md', 2)

    expect(helpRegistry.getHelps()).toHaveLength(3)
    expect(helpRegistry.getHelps().map(h => h.id)).toEqual(['id1', 'id2', 'id3'])
  })
})
