import { jolokiaService } from '@hawtiosrc/plugins/shared'
import { Metric, SystemProperty, Thread } from './types'

export const REFRESH_INTERVAL = 5000
function convertMsToDaysHours(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  return `${days} days, ${hours % 24} hours`
}

export function loadSystemProperties(): Promise<SystemProperty[]> {
  const systemProperties: SystemProperty[] = []
  return jolokiaService.readAttribute('java.lang:type=Runtime', 'SystemProperties').then(attr => {
    for (const [k, v] of Object.entries(attr as object)) {
      systemProperties.push({ key: k, value: v })
    }
    return systemProperties
  })
}

export function loadThreads(): Promise<Thread[]> {
  return jolokiaService.execute('java.lang:type=Threading', 'dumpAllThreads(boolean,boolean)', [
    false,
    false,
  ]) as Promise<Thread[]>
}

export async function isThreadContentionMonitoringEnabled(): Promise<boolean> {
  const res = await jolokiaService.readAttribute('java.lang:type=Threading', 'ThreadContentionMonitoringEnabled')
  return res as boolean
}

export async function enableThreadContentionMonitoring(enabled: boolean) {
  return await jolokiaService.writeAttribute('java.lang:type=Threading', 'ThreadContentionMonitoringEnabled', enabled)
}

export async function dumpThreads(): Promise<string> {
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

export async function loadMetrics(): Promise<Metric[]> {
  const metrics: Metric[] = []
  const threadCount = (await jolokiaService.readAttribute('java.lang:type=Threading', 'ThreadCount')) as number
  metrics.push({ type: 'JVM', name: 'Thread Count', value: threadCount })

  //jolokiaService.readAttributes('java.lang:type=Threading').then(console.log)
  const mb = (await jolokiaService.readAttribute('java.lang:type=Memory', 'HeapMemoryUsage')) as { used: number }
  const heapUsed = formatBytes(mb.used)
  metrics.push({
    type: 'JVM',
    name: 'Heap Used',
    value: heapUsed[0] ?? '',
    unit: heapUsed[1] as string,
  })
  const loadedClassCount = (await jolokiaService.readAttribute(
    'java.lang:type=ClassLoading',
    'LoadedClassCount',
  )) as number
  metrics.push({ type: 'JVM', name: 'Classes Loaded', value: loadedClassCount })

  const runtimeMetrics = (await jolokiaService.readAttributes('java.lang:type=Runtime')) as {
    StartTime: number
    Uptime: number
  }
  metrics.push({ type: 'JVM', name: 'Start time', value: new Date(runtimeMetrics.StartTime).toLocaleString() })
  metrics.push({ type: 'JVM', name: 'Uptime', value: convertMsToDaysHours(runtimeMetrics.Uptime) })
  const osMetrics = (await jolokiaService.readAttributes('java.lang:type=OperatingSystem')) as {
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
  const memFree = formatBytes(osMetrics.FreePhysicalMemorySize)
  const memTotal = formatBytes(osMetrics.TotalPhysicalMemorySize)
  metrics.push({ type: 'System', name: 'Available Processors', value: String(osMetrics.AvailableProcessors) })
  metrics.push({ type: 'System', name: 'CPU Load', value: String(cpuLoad), unit: '%', available: 100, chart: true })
  metrics.push({ type: 'System', name: 'Load Average', value: String(loadAverage) })
  metrics.push({
    type: 'System',
    name: 'Memory Used',
    value: memFree[0] as number,
    unit: memFree[1] as string,
    available: memTotal[0] as string,
    chart: true,
  })

  metrics.push({
    type: 'System',
    name: 'File Descriptors Used',
    value: osMetrics.OpenFileDescriptorCount as number,
    available: osMetrics.MaxFileDescriptorCount as number,
  })
  console.log(metrics)

  return metrics
}

export function formatBytes(bytes: number): (number | string)[] {
  if (bytes === 0) {
    return [0, 'Bytes']
  }
  const killobyte = 1024
  const decimalPlaces = 2
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(killobyte))
  const value = parseFloat((bytes / Math.pow(killobyte, i)).toFixed(decimalPlaces))
  const unit = units[i]
  return [value, unit ?? '']
}
