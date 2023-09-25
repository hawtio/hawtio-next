import { eventService } from '@hawtiosrc/core'
import { AttributeValues, MBeanNode, jolokiaService, workspace } from '@hawtiosrc/plugins/shared'
import { getQueryParameterValue } from '@hawtiosrc/util/urls'
import { Request } from 'jolokia.js'
import { attributeService } from '../shared/attributes/attribute-service'
import { jmxDomain, log } from './globals'

export type Trigger = {
  group: string
  name: string
  jobGroup: string
  jobName: string
  misfireInstruction: number
  previousFireTime?: string
  nextFireTime?: string
  finalFireTime?: string
  repeatCount: number
  repeatInterval: number

  state?: string
  type?: string
  cron?: string
  expression?: string
}

export const misfireInstructions = [
  { value: -1, label: 'Ignore' },
  { value: 0, label: 'Smart' },
  { value: 1, label: 'Fire once now' },
  { value: 2, label: 'Do nothing' },
] as const

export type TriggerFilter = {
  state: string
  group: string
  name: string
  type: string
}

export type JobDetails = Record<string, JobsByGroup>

export type JobsByGroup = Record<string, Job>

export type Job = {
  group: string
  name: string
  durability: boolean
  shouldRecover: boolean
  jobClass: string
  description?: string
  jobDataMap: Record<string, string>
}

export type JobFilter = {
  group: string
  name: string
  durability: 'true' | 'false' | ''
  shouldRecover: 'true' | 'false' | ''
  jobClass: string
  description: string
}

export const QUARTZ_OPERATIONS = {
  start: 'start()',
  standby: 'standby()',
  getTriggerState: 'getTriggerState',
  pauseTrigger: 'pauseTrigger',
  resumeTrigger: 'resumeTrigger',
  triggerJob: 'triggerJob',
} as const

const QUARTZ_FACADE_MBEAN = 'hawtio:type=QuartzFacade'

export const QUARTZ_FACADE_OPERATIONS = {
  updateCronTrigger: 'updateCronTrigger',
  updateSimpleTrigger: 'updateSimpleTrigger',
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

  async loadTriggers(schedulerMBean: string): Promise<Trigger[]> {
    const attrs = await attributeService.read(schedulerMBean)
    const triggers = attrs['AllTriggers'] as Trigger[]
    const jobDetails = attrs['AllJobDetails'] as JobDetails
    await quartzService.loadTriggerStates(schedulerMBean, triggers, jobDetails)
    return triggers
  }

  async loadJobs(schedulerMBean: string): Promise<Job[]> {
    const attrs = await attributeService.read(schedulerMBean)
    const jobDetails = attrs['AllJobDetails'] as JobDetails
    return Object.values(jobDetails).flatMap(jobsByGroup => Object.values(jobsByGroup))
  }

  registerTriggersLoad(schedulerMBean: string, callback: (triggers: Trigger[]) => void) {
    attributeService.register({ type: 'read', mbean: schedulerMBean }, async response => {
      const attrs = response.value as AttributeValues
      log.debug('Scheduler - Attributes:', attrs)
      const triggers = attrs['AllTriggers'] as Trigger[]
      const jobDetails = attrs['AllJobDetails'] as JobDetails
      await quartzService.loadTriggerStates(schedulerMBean, triggers, jobDetails)
      log.debug('Scheduler - Triggers:', triggers)
      callback(triggers)
    })
  }

  registerJobsLoad(schedulerMBean: string, callback: (jobs: Job[]) => void) {
    attributeService.register({ type: 'read', mbean: schedulerMBean }, async response => {
      const attrs = response.value as AttributeValues
      log.debug('Scheduler - Attributes:', attrs)
      const jobDetails = attrs['AllJobDetails'] as JobDetails
      const jobs = Object.values(jobDetails).flatMap(jobsByGroup => Object.values(jobsByGroup))
      log.debug('Scheduler - Jobs:', jobs)
      callback(jobs)
    })
  }

  unregisterAll() {
    attributeService.unregisterAll()
  }

  /**
   * Grabs state for a trigger which requires to call a JMX operation.
   */
  private async loadTriggerStates(schedulerMBean: string, triggers: Trigger[], jobDetails: JobDetails) {
    if (triggers.length === 0) {
      return
    }

    const requests: Request[] = triggers.map(trigger => ({
      type: 'exec',
      mbean: schedulerMBean,
      operation: QUARTZ_OPERATIONS.getTriggerState,
      arguments: [trigger.name, trigger.group],
    }))
    const responses = await jolokiaService.bulkRequest(requests)
    triggers.forEach((trigger, index) => {
      trigger.state = (responses[index]?.value ?? 'unknown') as string
      this.applyJobDetails(trigger, jobDetails)
    })
  }

  /**
   * Grabs information about the trigger from the job map, as quartz does not have
   * the information itself so we had to enrich the job map in camel-quartz to include
   * this information.
   */
  private applyJobDetails(trigger: Trigger, jobDetails: JobDetails) {
    const job = jobDetails[trigger.jobName]?.[trigger.group]
    if (!job) {
      return
    }

    const jobDataMap = job.jobDataMap || {}
    trigger.type = jobDataMap['CamelQuartzTriggerType']
    switch (trigger.type) {
      case 'cron':
        trigger.expression = jobDataMap['CamelQuartzTriggerCronExpression']
        break
      case 'simple': {
        trigger.expression = `every ${jobDataMap['CamelQuartzTriggerSimpleRepeatInterval']} ms.`
        const repeatCount = parseInt(jobDataMap['CamelQuartzTriggerSimpleRepeatCounter'] ?? '')
        const repeatInterval = parseInt(jobDataMap['CamelQuartzTriggerSimpleRepeatInterval'] ?? '')
        if (repeatCount > 0) {
          trigger.expression += ` (${repeatCount} times)`
        } else {
          trigger.expression += ' (forever)'
        }
        trigger.repeatCount = repeatCount
        trigger.repeatInterval = repeatInterval
        break
      }
      default: {
        // Fallback and grab from Camel endpoint if that is possible (supporting older Camel releases)
        const uri = jobDataMap['CamelQuartzEndpoint']
        if (uri) {
          let cron = getQueryParameterValue(uri, 'cron')
          if (cron) {
            trigger.type = 'cron'
            // Replace + with space as Camel uses + as space in the cron when specifying in the uri
            cron = cron.replace(/\++/g, ' ')
            trigger.expression = cron
          }
          const repeatCount = parseInt(getQueryParameterValue(uri, 'trigger.repeatCount') ?? '')
          const repeatInterval = parseInt(getQueryParameterValue(uri, 'trigger.repeatInterval') ?? '')
          if (repeatCount || repeatInterval) {
            trigger.type = 'simple'
            trigger.expression = `every ${repeatInterval} ms.`
            if (repeatCount > 0) {
              trigger.expression += ` (${repeatCount} times)`
            } else {
              trigger.expression += ` (forever)`
            }
            trigger.repeatCount = repeatCount
            trigger.repeatInterval = repeatInterval
          }
        }
      }
    }
  }

  filterTriggers(triggers: Trigger[], filter: TriggerFilter): Trigger[] {
    const { state, group, name, type } = filter
    return triggers.filter(trigger => {
      if (state !== '' && trigger.state !== state) {
        return false
      }
      if (group !== '' && !this.match(trigger.group, group)) {
        return false
      }
      if (name !== '' && !this.match(trigger.name, name)) {
        return false
      }
      if (type !== '' && !this.match(trigger.type ?? '', type)) {
        return false
      }
      return true
    })
  }

  filterJobs(jobs: Job[], filter: JobFilter): Job[] {
    const { group, name, durability, shouldRecover, jobClass, description } = filter
    return jobs.filter(job => {
      if (group !== '' && !this.match(job.group, group)) {
        return false
      }
      if (name !== '' && !this.match(job.name, name)) {
        return false
      }
      if (durability !== '' && String(job.durability) !== durability) {
        return false
      }
      if (shouldRecover !== '' && String(job.shouldRecover) !== shouldRecover) {
        return false
      }
      if (jobClass !== '' && !this.match(job.jobClass, jobClass)) {
        return false
      }
      if (description !== '' && !this.match(job.description ?? '', description)) {
        return false
      }
      return true
    })
  }

  private match(value: string, pattern: string): boolean {
    const regexp = new RegExp(pattern, 'i')
    return value.match(regexp) !== null
  }

  async pauseTrigger(schedulerMBean: string, name: string, group: string) {
    await jolokiaService.execute(schedulerMBean, QUARTZ_OPERATIONS.pauseTrigger, [name, group])
    eventService.notify({
      type: 'success',
      message: `Paused trigger: ${group}/${name}`,
    })
  }

  async resumeTrigger(schedulerMBean: string, name: string, group: string) {
    await jolokiaService.execute(schedulerMBean, QUARTZ_OPERATIONS.resumeTrigger, [name, group])
    eventService.notify({
      type: 'success',
      message: `Resumed trigger: ${group}/${name}`,
    })
  }

  async updateTrigger(schedulerMBean: string, trigger: Trigger) {
    const { name, group, misfireInstruction, type } = trigger
    switch (type) {
      case 'cron':
        await jolokiaService.execute(QUARTZ_FACADE_MBEAN, QUARTZ_FACADE_OPERATIONS.updateCronTrigger, [
          schedulerMBean,
          name,
          group,
          misfireInstruction,
          trigger.expression,
          null,
        ])
        break
      case 'simple':
        await jolokiaService.execute(QUARTZ_FACADE_MBEAN, QUARTZ_FACADE_OPERATIONS.updateSimpleTrigger, [
          schedulerMBean,
          name,
          group,
          misfireInstruction,
          trigger.repeatCount,
          trigger.repeatInterval,
        ])
        break
      default:
        eventService.notify({
          type: 'danger',
          message: `Could not update trigger ${group}/${name} due to unknown type: ${type}`,
        })
        return
    }
    eventService.notify({
      type: 'success',
      message: `Updated trigger: ${group}/${name}`,
    })
  }

  async triggerJob(schedulerMBean: string, name: string, group: string, parameters: string) {
    await jolokiaService.execute(schedulerMBean, QUARTZ_OPERATIONS.triggerJob, [
      name,
      group,
      parameters === '' ? {} : JSON.parse(parameters),
    ])
    eventService.notify({
      type: 'success',
      message: `Manually fired trigger: ${group}/${name}`,
    })
  }
}

export const quartzService = new QuartzService()
