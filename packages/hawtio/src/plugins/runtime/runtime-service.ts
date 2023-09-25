import { jolokiaService } from '@hawtiosrc/plugins/shared'
import { Request, Response } from 'jolokia.js'
import { Metric, SystemProperty, Thread } from './types'

class RuntimeService {
  handlers: number[] = []

  convertMsToDaysHours(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    return `${days} days, ${hours % 24} hours`
  }

  async loadSystemProperties(): Promise<SystemProperty[]> {
    const systemProperties: SystemProperty[] = []
    const attr = await jolokiaService.readAttribute('java.lang:type=Runtime', 'SystemProperties')
    for (const [k, v] of Object.entries(attr as object)) {
      systemProperties.push({ key: k, value: v })
    }
    return systemProperties
  }

  async registerLoadThreadsRequest(callback: (threads: Thread[]) => void) {
    const handler = await jolokiaService.register(
      {
        type: 'exec',
        mbean: 'java.lang:type=Threading',
        operation: 'dumpAllThreads(boolean,boolean)',
        arguments: [true, true],
      },
      resp => {
        const threads = resp.value as Thread[]
        callback(threads)
      },
    )
    this.handlers.push(handler)
  }

  loadThreads(): Promise<Thread[]> {
    return jolokiaService.execute('java.lang:type=Threading', 'dumpAllThreads(boolean,boolean)', [
      false,
      false,
    ]) as Promise<Thread[]>
  }

  async isThreadContentionMonitoringEnabled(): Promise<boolean> {
    const res = await jolokiaService.readAttribute('java.lang:type=Threading', 'ThreadContentionMonitoringEnabled')
    return res as boolean
  }

  async enableThreadContentionMonitoring(enabled: boolean) {
    return await jolokiaService.writeAttribute('java.lang:type=Threading', 'ThreadContentionMonitoringEnabled', enabled)
  }

  async dumpThreads(): Promise<string> {
    const threads = await jolokiaService.execute('java.lang:type=Threading', 'dumpAllThreads(boolean, boolean)', [
      true,
      true,
    ])
    const thrs: Thread[] = threads as Thread[]
    let dumpedThreads = ''
    thrs.forEach(thread => {
      const name = thread.threadName
      const daemon = thread.daemon ? ' daemon' : ''
      let threadInfo = `"${name}" #${thread.threadId}${daemon} priority:${thread.priority} State:${thread.threadState}`
      thread.stackTrace.forEach(st => {
        const lineNo = st.lineNumber > 0 ? ':' + st.lineNumber : ''
        const native = st.nativeMethod ? '(Native)' : ''
        threadInfo += `\n\tat ${st.className}.${st.methodName}(${st.fileName}${lineNo})${native}`
      })
      dumpedThreads += (dumpedThreads === '' ? '' : '\n\n') + threadInfo
    })
    return dumpedThreads
  }

  getRegisterRequest(mbean: string, attribute?: string, args?: string[]): Request {
    const request: Request = { type: 'read', mbean: mbean }
    if (attribute) {
      request.attribute = attribute
    }
    return request
  }

  responseCallback(response: Response, callback: (metric: Metric) => void) {
    const req = response.request as { type: 'read'; mbean: string; attribute?: string | string[]; path?: string }
    switch (req.mbean) {
      case 'java.lang:type=Threading': {
        const threadCount = response.value as number
        callback({ type: 'JVM', name: 'Thread Count', value: threadCount })
        break
      }
      case 'java.lang:type=Memory': {
        const mb = response.value as { used: number }
        const heapUsed = this.formatBytes(mb.used)
        callback({
          type: 'JVM',
          name: 'Heap Used',
          value: heapUsed[0] ?? '',
          unit: heapUsed[1] as string,
        })
        break
      }
      case 'java.lang:type=OperatingSystem': {
        const osMetrics = response.value as {
          SystemCpuLoad: number
          SystemLoadAverage: number
          FreePhysicalMemorySize: number
          TotalPhysicalMemorySize: number
          AvailableProcessors: number
          OpenFileDescriptorCount: number
          MaxFileDescriptorCount: number
        }
        const cpuLoad = osMetrics.SystemCpuLoad * 100
        const loadAverage = osMetrics.SystemLoadAverage
        const memFree = this.formatBytes(osMetrics.FreePhysicalMemorySize)
        const memTotal = this.formatBytes(osMetrics.TotalPhysicalMemorySize)
        callback({ type: 'System', name: 'Available Processors', value: String(osMetrics.AvailableProcessors) })
        callback({ type: 'System', name: 'CPU Load', value: String(cpuLoad), unit: '%', available: 100, chart: true })
        callback({ type: 'System', name: 'Load Average', value: String(loadAverage) })
        callback({
          type: 'System',
          name: 'Memory Used',
          value: memFree[0] as number,
          unit: memFree[1] as string,
          available: memTotal[0] as string,
          chart: true,
        })

        callback({
          type: 'System',
          name: 'File Descriptors Used',
          value: osMetrics.OpenFileDescriptorCount as number,
          available: osMetrics.MaxFileDescriptorCount as number,
        })
        break
      }
      case 'java.lang:type=ClassLoading': {
        const loadedClassCount = response.value as number
        callback({ type: 'JVM', name: 'Classes Loaded', value: loadedClassCount })
        break
      }
      case 'java.lang:type=Runtime': {
        const runtimeMetrics = response.value as {
          StartTime: number
          Uptime: number
        }
        callback({ type: 'JVM', name: 'Start time', value: new Date(runtimeMetrics.StartTime).toLocaleString() })
        callback({ type: 'JVM', name: 'Uptime', value: this.convertMsToDaysHours(runtimeMetrics.Uptime) })
        break
      }
    }
  }

  getJolokiaRequests(): Request[] {
    const requests: Request[] = []
    requests.push(this.getRegisterRequest('java.lang:type=Threading', 'ThreadCount'))
    requests.push(this.getRegisterRequest('java.lang:type=Memory', 'HeapMemoryUsage'))
    requests.push(this.getRegisterRequest('java.lang:type=Runtime'))
    requests.push(this.getRegisterRequest('java.lang:type=OperatingSystem'))
    requests.push(this.getRegisterRequest('java.lang:type=ClassLoading', 'LoadedClassCount'))
    return requests
  }

  async registerMetrics(callback: (metrics: Metric) => void) {
    for (const request of this.getJolokiaRequests()) {
      const handler = await jolokiaService.register(request, resp => {
        this.responseCallback(resp, callback)
      })
      this.handlers.push(handler)
    }
  }

  async loadMetrics(): Promise<Metric[]> {
    const metrics: Metric[] = []

    const responses = await jolokiaService.bulkRequest(this.getJolokiaRequests())
    responses.forEach(resp => {
      this.responseCallback(resp, metric => metrics.push(metric))
    })

    return metrics
  }

  formatBytes(bytes: number): (number | string)[] {
    if (bytes === 0) {
      return [0, 'Bytes']
    }
    const kilobytes = 1024
    const decimalPlaces = 2
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(kilobytes))
    const value = parseFloat((bytes / Math.pow(kilobytes, i)).toFixed(decimalPlaces))
    const unit = units[i]
    return [value, unit ?? '']
  }

  unregisterAll() {
    this.handlers.forEach(handle => jolokiaService.unregister(handle))
    this.handlers = []
  }
}

export const runtimeService = new RuntimeService()
