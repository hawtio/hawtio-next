import { MBeanNode, jolokiaService } from '@hawtiosrc/plugins/shared'
import { IRequest, IResponseFn } from 'jolokia.js'
import { log } from '../globals'
import { routesService } from '../routes-service'

export type ProfileData = {
  id: string
  count: number
  last: number
  delta: number
  mean: number
  min: number
  max: number
  total: number
  self: number
}

class ProfileService {
  private handles: number[] = []

  async register(request: IRequest, callback: IResponseFn) {
    const handle = await jolokiaService.register(request, callback)
    log.debug('Register handle:', handle)
    this.handles.push(handle)
  }

  unregisterAll() {
    log.debug('Unregister all handles:', this.handles)
    this.handles.forEach(handle => jolokiaService.unregister(handle))
    this.handles = []
  }

  async getProfile(node: MBeanNode): Promise<ProfileData[]> {
    const xml = await routesService.dumpRoutesStatsXML(node)
    if (!xml) return []

    const profile: ProfileData[] = []
    const stats = routesService.processRoutesStats(xml)

    stats.forEach(stat => {
      const routeData: ProfileData = {
        id: stat.id,
        count:
          (!stat.exchangesCompleted ? 0 : +stat.exchangesCompleted) +
          (!stat.exchangesFailed ? 0 : +stat.exchangesFailed),
        last: !stat.lastProcessingTime ? 0 : +stat.lastProcessingTime,
        delta: !stat.deltaProcessingTime ? 0 : +stat.deltaProcessingTime,
        mean: !stat.meanProcessingTime ? 0 : +stat.meanProcessingTime,
        min: !stat.minProcessingTime ? 0 : +stat.minProcessingTime,
        max: !stat.maxProcessingTime ? 0 : +stat.maxProcessingTime,
        total: !stat.totalProcessingTime ? 0 : +stat.totalProcessingTime,
        self: !stat.selfProcessingTime ? 0 : +stat.selfProcessingTime,
      }

      profile.push(routeData)

      stat.processorStats.forEach(processor => {
        const processorData: ProfileData = {
          id: processor.id,
          count:
            (!processor.exchangesCompleted ? 0 : +processor.exchangesCompleted) +
            (!processor.exchangesFailed ? 0 : +processor.exchangesFailed),
          last: !processor.lastProcessingTime ? 0 : +processor.lastProcessingTime,
          delta: !processor.deltaProcessingTime ? 0 : +processor.deltaProcessingTime,
          mean: !processor.meanProcessingTime ? 0 : +processor.meanProcessingTime,
          min: !processor.minProcessingTime ? 0 : +processor.minProcessingTime,
          max: !processor.maxProcessingTime ? 0 : +processor.maxProcessingTime,
          total: !processor.accumulatedProcessingTime ? 0 : +processor.accumulatedProcessingTime,

          // self time for processors is their total time
          self: !processor.totalProcessingTime ? 0 : +processor.totalProcessingTime,
        }

        profile.push(processorData)
      })
    })

    return profile
  }
}

export const profileService = new ProfileService()
