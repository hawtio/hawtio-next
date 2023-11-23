export type HealthComponent = {
  name: string
  status: string
  details?: HealthComponentDetail[]
}
export type HealthComponentDetail = {
  key: string
  value: string | HealthComponentDetail[]
}
export type HealthData = {
  components: HealthComponent[]
  status: string
}

export type JolokiaHealthData = {
  status: string
  components: {
    [name: string]: {
      details?: {
        [key: string]:
          | string
          | {
              [key: string]: string
            }
      }
      status: string
    }
  }
}
export type LoggerConfiguration = {
  levels: string[]
  loggers: Logger[]
}

export type Logger = {
  name: string
  configuredLevel: string
  effectiveLevel: string
}

export class Trace {
  timestamp: string
  method: string = ''
  path: string = ''
  httpStatusCode: number = -1
  timeTaken: string = '-1'
  info: string = ''

  constructor(trace: JmxTrace) {
    this.timestamp = trace.timestamp

    if (trace.info) {
      this.method = trace.info.method
      this.path = trace.info.path
      this.info = JSON.stringify(trace.info, null, 2)

      if (trace.info.timeTaken) {
        this.timeTaken = trace.info.timeTaken
      }

      if (trace.info.headers?.response) {
        this.httpStatusCode = parseInt(trace.info.headers.response.status)
      }
    } else if (trace.request) {
      this.method = trace.request.method
      this.path = new URL(trace.request.uri).pathname
      this.info = JSON.stringify(trace, null, 2)

      if (trace.timeTaken) {
        this.timeTaken = trace.timeTaken
      }

      if (trace.response && trace.response.status) {
        this.httpStatusCode = parseInt(trace.response.status)
      }
    }
  }
}

export type JmxTrace = {
  timestamp: string
  info?: {
    method: string
    path: string
    timeTaken?: string
    headers?: {
      response?: {
        status: string
      }
    }
  }
  request?: {
    method: string
    uri: string
  }
  timeTaken?: string
  response?: {
    status?: string
  }
}
