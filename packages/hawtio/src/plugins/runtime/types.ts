export type SystemProperty = {
  key: string
  value: string
}

export type Metric = {
  type: 'JVM' | 'System'
  name: string
  value: string | number
  unit?: string
  available?: string | number
  chart?: boolean
}
export type Thread = {
  blockedCount: number
  daemon: boolean
  blockedTime: string
  inNative: boolean
  lockInfo: { lockName: string; className: string; identityHashCode: string }
  lockOwnerId: number
  lockOwnerName: string
  lockedMonitors: {
    lockedStackDepth: number
    lockedStackFrame: {
      className: string
      methodName: string
      fileName: string
      lineNumber: number
      nativeMethod: boolean
    }
  }[]
  lockedSynchronizers: { className: string; identityHashCode: string }[]
  suspended: boolean
  threadId: number
  threadName: string
  threadState: string
  waitedCount: number
  waitedTime: string
  priority: number
  stackTrace: {
    classLoaderName: string
    className: string
    fileName: string
    lineNumber: number
    methodName: string
    moduleName: string
    moduleVersion: string
    nativeMethod: boolean
  }[]
}
