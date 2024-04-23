import { hawtioBackend } from './router'

test('hawtioBackend', () => {
  expect(hawtioBackend()).not.toBeNull()
})
