import { userService } from '@hawtiosrc/auth'
import { jolokiaService } from '@hawtiosrc/plugins/shared/jolokia-service'
import { rbacService } from './rbac-service'

jest.mock('@hawtiosrc/plugins/shared/jolokia-service')

describe('RBACService', () => {
  beforeEach(() => {
    jest.resetModules()
    rbacService.reset()
  })

  test('there are no ACLMBeans', async () => {
    userService.isLogin = jest.fn(async () => true)
    jolokiaService.search = jest.fn(async () => [])

    await expect(rbacService.getACLMBean()).resolves.toBeNull()
  })

  test('there is one ACLMBean', async () => {
    userService.isLogin = jest.fn(async () => true)
    jolokiaService.search = jest.fn(async () => ['hawtio:type=security,area=jmx,name=HawtioTestJMXSecurity'])

    await expect(rbacService.getACLMBean()).resolves.toBe('hawtio:type=security,area=jmx,name=HawtioTestJMXSecurity')
  })

  test('there are multiple ACLMBeans', async () => {
    userService.isLogin = jest.fn(async () => true)
    jolokiaService.search = jest.fn(async () => [
      'hawtio:type=security,area=jmx,name=HawtioDummyJMXSecurity',
      'hawtio:type=security,area=jmx,name=HawtioTestJMXSecurity',
      'io.test:type=security,area=jmx,name=AnotherJMXSecurity',
    ])

    await expect(rbacService.getACLMBean()).resolves.toBe('hawtio:type=security,area=jmx,name=HawtioTestJMXSecurity')
  })
})
