import { jolokiaService } from '@hawtiosrc/plugins/shared'
import { SystemProperty, Thread } from './types'

export function getSystemProperties(): Promise<SystemProperty[]> {
  const systemProperties: SystemProperty[] = []
  return jolokiaService.readAttribute('java.lang:type=Runtime', 'SystemProperties').then(attr => {
    for (const [k, v] of Object.entries(attr as object)) {
      systemProperties.push({ key: k, value: v })
    }
    return systemProperties
  })
}

export function getThreads(): Promise<Thread[]> {
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
