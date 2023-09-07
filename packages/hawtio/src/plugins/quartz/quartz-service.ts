import { MBeanNode, jolokiaService, workspace } from '@hawtiosrc/plugins/shared'
import { jmxDomain } from './globals'
import { eventService } from '@hawtiosrc/core'

export const QUARTZ_OPERATIONS = {
  start: 'start()',
  standby: 'standby()',
} as const

class QuartzService {
  async isActive(): Promise<boolean> {
    return workspace.treeContainsDomainAndProperties(jmxDomain)
  }

  async searchSchedulers(): Promise<MBeanNode[]> {
    // MBeans named 'quartz:type=QuartzScheduler,*'
    return workspace.findMBeans(jmxDomain, { type: 'QuartzScheduler' })
  }

  async start(schedulerName: string, schedulerMBean: string) {
    await jolokiaService.execute(schedulerMBean, QUARTZ_OPERATIONS.start)
    eventService.notify({
      type: 'success',
      message: `Started scheduler: ${schedulerName}`,
    })
  }

  async pause(schedulerName: string, schedulerMBean: string) {
    await jolokiaService.execute(schedulerMBean, QUARTZ_OPERATIONS.standby)
    eventService.notify({
      type: 'success',
      message: `Paused scheduler: ${schedulerName}`,
    })
  }

  async updateSampleStatisticsEnabled(schedulerName: string, schedulerMBean: string, value: boolean) {
    await jolokiaService.writeAttribute(schedulerMBean, 'SampledStatisticsEnabled', value)
    eventService.notify({
      type: 'success',
      message: `${value ? 'Enabled' : 'Disabled'} sampled statistics for scheduler: ${schedulerName}`,
    })
  }
}

export const quartzService = new QuartzService()
