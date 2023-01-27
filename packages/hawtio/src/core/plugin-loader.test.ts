import { hawtio } from './plugin-loader'

describe('PluginLoader', () => {
  test('hawtio exists', () => {
    expect(hawtio).not.toBeNull()
  })
})
