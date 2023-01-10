import { helpRegistry } from './registry'
import * as support from '@hawtio/test/support'

let realFetch: typeof global.fetch;

describe('helpRegistry', () => {
  beforeEach(() => {
    helpRegistry.reset();
    realFetch = global.fetch;
  })

  afterEach(() => {
    global.fetch = realFetch;
  })

  test('add a help', async () => {

    const payload = `
      # Help Test
      Test help content.
    `;
    support.mockFetch(payload)

    expect(helpRegistry).not.toBeNull()
    expect(helpRegistry.getHelps()).toEqual([])
    await helpRegistry.add('test', 'Test', './help.md')
    expect(helpRegistry.getHelps()).toHaveLength(1)
    expect(helpRegistry.getHelps()[0].id).toEqual('test')
    expect(helpRegistry.getHelps()[0].title).toEqual('Test')
    expect(helpRegistry.getHelps()[0].content).toEqual(`
      # Help Test
      Test help content.
    `)

    // duplicate help not allowed
    expect(() => helpRegistry.add('test', 'Test', './help.md'))
      .rejects.toThrowError(/Help 'test' already registered/)
  })

  test('return helps in order', async () => {
    support.mockFetch('')

    expect(helpRegistry).not.toBeNull()
    expect(helpRegistry.getHelps()).toEqual([])

    await helpRegistry.add('id3', 'Help3', './help.md', 3)
    await helpRegistry.add('id1', 'Help1', './help.md', 1)
    await helpRegistry.add('id2', 'Help2', './help.md', 2)

    expect(helpRegistry.getHelps()).toHaveLength(3)
    expect(helpRegistry.getHelps().map(h => h.id)).toEqual(['id1', 'id2', 'id3'])
  })
})
