import { userService } from '@hawtiosrc/auth'
import { jolokiaService } from '@hawtiosrc/plugins/shared'
import { isBlank } from '@hawtiosrc/util/strings'
import { log } from './globals'

const ACL_MBEAN_PATTERN = '*:type=security,area=jmx,*'

interface IRBACService {
  reset(): void
  getACLMBean(): Promise<string | null>
}

class RBACService implements IRBACService {
  private aclMBean?: Promise<string | null>

  reset() {
    this.aclMBean = undefined
  }

  getACLMBean(): Promise<string | null> {
    if (this.aclMBean) {
      return this.aclMBean
    }

    // Initialise ACL MBean
    this.aclMBean = this.fetchACLMBean()
    return this.aclMBean
  }

  private async fetchACLMBean(): Promise<string | null> {
    if (!(await userService.isLogin())) {
      throw new Error('User needs to have logged in to run RBAC plugin')
    }

    const mbeans = await jolokiaService.search(ACL_MBEAN_PATTERN)
    log.debug('Fetching ACL MBeans:', mbeans)

    if (mbeans.length === 0) {
      log.info("Didn't discover any ACL MBeans; client-side RBAC is disabled")
      return null
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
      return null
    }
    log.info('Use MBean', chosen, 'for client-side RBAC')
    return chosen
  }
}

export const rbacService = new RBACService()
