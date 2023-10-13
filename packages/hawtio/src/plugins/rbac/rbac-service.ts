import { userService } from '@hawtiosrc/auth'
import { jolokiaService } from '@hawtiosrc/plugins/shared'
import { isBlank } from '@hawtiosrc/util/strings'
import { log } from './globals'

const ACL_MBEAN_PATTERN = '*:type=security,area=jmx,*'

interface IRBACService {
  getACLMBean(): Promise<string>
}

class RBACService implements IRBACService {
  private aclMBean: Promise<string> | null = null

  private async init(): Promise<string> {
    // Wait for resolving user as it may attach credentials to http request headers
    const loggedIn = await userService.isLogin()
    if (!loggedIn) {
      throw new Error('Workspace not available as user is not logged-in')
    }

    if (!this.aclMBean) {
      this.aclMBean = this.fetchACLMBean()
      await this.aclMBean
    }

    return this.aclMBean
  }

  private async fetchACLMBean(): Promise<string> {
    const mbeans = await jolokiaService.search(ACL_MBEAN_PATTERN)
    log.debug('Fetching ACL MBeans:', mbeans)

    if (mbeans.length === 0) {
      log.info("Didn't discover any ACL MBeans; client-side RBAC is disabled")
      return ''
    }

    const mbean = mbeans[0]
    if (mbean && mbeans.length === 1) {
      log.info('Use MBean', mbean, 'for client-side RBAC')
      return mbean
    }

    // mbeans > 1
    const chosen = mbeans.find(mbean => !mbean.includes('HawtioDummy'))
    if (!chosen || isBlank(chosen)) {
      log.info("Didn't discover any effective ACL MBeans; client-side RBAC is disabled")
      return ''
    }
    log.info('Use MBean', chosen, 'for client-side RBAC')
    return chosen
  }

  getACLMBean(): Promise<string> {
    return this.init()
  }
}

export const rbacService = new RBACService()

// Export non-exported definitions for testing
export const __testing__ = {
  RBACService,
}
