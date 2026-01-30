import { userService } from '@hawtiosrc/auth'
import { DEFAULT_MAX_COLLECTION_SIZE, DEFAULT_MAX_DEPTH, JolokiaListMethod, jolokiaService } from './jolokia-service'
import { hawtio } from '@hawtiosrc/core'
import * as jolokia from 'jolokia.js'
import Jolokia, { SimpleRequestOptions, SimpleResponseCallback } from '@jolokia.js/simple'

describe('JolokiaService', () => {
  beforeEach(() => {
    jest.resetModules()
    localStorage.clear()
    jolokiaService.reset()

    userService.isLogin = jest.fn(async () => true)
  })

  test('getJolokiaUrl - not logged in', async () => {
    userService.isLogin = jest.fn(async () => false)
    await expect(jolokiaService.getJolokiaUrl()).resolves.toBeNull()
  })

  test('getJolokiaUrl - null', async () => {
    await expect(jolokiaService.getJolokiaUrl()).resolves.toBeNull()
  }, 10000)

  test('getJolokia - optimised (mbean)', async () => {
    jolokiaService.getJolokiaUrl = jest.fn(async () => '/test')
    Jolokia.prototype.list = jest.fn(
      (path?: string | string[] | jolokia.RequestOptions, opts?: SimpleRequestOptions) => {
        if (typeof path !== 'string') throw new Error('String is expected for path')
        if (!opts) throw new Error('No options set')
        if (!opts.success) {
          throw new Error('No success option set')
        }

        ;(opts.success! as SimpleResponseCallback)({
          desc: '',
          attr: {},
          op: {
            value: { desc: 'exec', args: [], ret: '' },
          },
        })
        return null
      },
    )
    Jolokia.prototype.version = jest.fn((opts?: SimpleRequestOptions) => {
      ;(opts!.success! as SimpleResponseCallback)({
        agent: 'test',
        protocol: '7.3',
        info: {},
        config: {},
      })
    })

    await expect(jolokiaService.getJolokia()).resolves.not.toThrow()
    await expect(jolokiaService.getListMethod()).resolves.toEqual(JolokiaListMethod.OPTIMISED)
  })

  test('getJolokia - optimised (native)', async () => {
    jolokiaService.getJolokiaUrl = jest.fn(async () => '/test')
    Jolokia.prototype.version = jest.fn((opts?: SimpleRequestOptions) => {
      ;(opts!.success! as SimpleResponseCallback)({
        agent: 'test',
        protocol: '8.0',
        info: {},
        config: {},
      })
    })

    await expect(jolokiaService.getJolokia()).resolves.not.toThrow()
    await expect(jolokiaService.getListMethod()).resolves.toEqual(JolokiaListMethod.NATIVE)
  })

  test('getJolokia - default', async () => {
    jolokiaService.getJolokiaUrl = jest.fn(async () => '/test')
    Jolokia.prototype.list = jest.fn((...params: (string[] | string | SimpleRequestOptions)[]) => {
      let path
      let opts: SimpleRequestOptions | undefined = undefined
      if (params.length === 2 && !Array.isArray(params[1]) && typeof params[1] === 'object') {
        path = params[0] as string | string[]
        opts = params[1] as SimpleRequestOptions
      } else if (params.length === 1) {
        if (!Array.isArray(params[0]) && !Array.isArray(params[0]) && typeof params[0] === 'object') {
          opts = params[0] as SimpleRequestOptions
        } else {
          path = params[0] as string | string[]
        }
      }

      if (typeof path !== 'string') throw new Error('String is expected for path')
      if (!opts) throw new Error('No options set')
      if (!opts.error) {
        throw new Error('No error option set')
      }

      ;(opts.error! as jolokia.ErrorCallback)(
        {
          status: -1,
          timestamp: 123456789,
          request: { type: 'list', path: path },
          error_type: 'non-exist',
          error: 'ERROR HAS OCCURRED',
          stacktrace: 'not available',
        },
        0,
      )
      return null
    })
    Jolokia.prototype.version = jest.fn((opts?: SimpleRequestOptions) => {
      ;(opts!.success! as SimpleResponseCallback)({
        agent: 'test',
        protocol: '7.3',
        info: {},
        config: {},
      })
    })

    await expect(jolokiaService.getJolokia()).resolves.not.toThrow()
    await expect(jolokiaService.getListMethod()).resolves.toEqual(JolokiaListMethod.DEFAULT)
  })

  test('getFullJolokiaUrl', async () => {
    hawtio.getBasePath = jest.fn(() => '/hawtio')

    jolokiaService.getJolokiaUrl = jest.fn(async () => '/hawtio/jolokia')
    await expect(jolokiaService.getFullJolokiaUrl()).resolves.toEqual('http://localhost/hawtio/jolokia')

    jolokiaService.getJolokiaUrl = jest.fn(async () => 'jolokia')
    await expect(jolokiaService.getFullJolokiaUrl()).resolves.toEqual('http://localhost/hawtio/jolokia')

    jolokiaService.getJolokiaUrl = jest.fn(async () => 'http://test:12345/test/jolokia')
    await expect(jolokiaService.getFullJolokiaUrl()).resolves.toEqual('http://test:12345/test/jolokia')

    jolokiaService.getJolokiaUrl = jest.fn(async () => 'https://test:12345/test/jolokia')
    await expect(jolokiaService.getFullJolokiaUrl()).resolves.toEqual('https://test:12345/test/jolokia')

    jolokiaService.getJolokiaUrl = jest.fn(async () => 'http/jolokia')
    await expect(jolokiaService.getFullJolokiaUrl()).resolves.toEqual('http://localhost/hawtio/http/jolokia')
  })

  test('load and save Jolokia options', () => {
    let options = jolokiaService.loadJolokiaStoredOptions()
    expect(options.maxDepth).toEqual(DEFAULT_MAX_DEPTH)
    expect(options.maxCollectionSize).toEqual(DEFAULT_MAX_COLLECTION_SIZE)

    jolokiaService.saveJolokiaStoredOptions({ maxDepth: 3, maxCollectionSize: 10000 })
    options = jolokiaService.loadJolokiaStoredOptions()
    expect(options.maxDepth).toEqual(3)
    expect(options.maxCollectionSize).toEqual(10000)
  })

  test('unwindListResponse', () => {
    const response = {
      value: {
        'org.apache.camel': {
          'context=hello,type=context,name="hello"': {
            op: {
              getExchangesCompleted: { args: [], ret: 'long', desc: 'ExchangesCompleted' },
              getLastProcessingTime: { args: [], ret: 'long', desc: 'LastProcessingTime' },
              getDeltaProcessingTime: { args: [], ret: 'long', desc: 'DeltaProcessingTime' },
              dumpStepStatsAsXml: {
                args: [{ name: 'p1', type: 'boolean', desc: '' }],
                ret: 'java.lang.String',
                desc: 'Dumps the CamelContext and routes and steps stats as XML',
              },
              getCamelVersion: { args: [], ret: 'java.lang.String', desc: 'CamelVersion' },
              dumpRestsAsXml: [
                { args: [], ret: 'java.lang.String', desc: 'Dumps the rests as XML' },
                {
                  args: [{ name: 'p1', type: 'boolean', desc: '' }],
                  ret: 'java.lang.String',
                  desc: 'Dumps the rests as XML',
                },
              ],
              getStartTimestamp: { args: [], ret: 'java.util.Date', desc: 'StartTimestamp' },
              isLogMask: { args: [], ret: 'boolean', desc: 'LogMask' },
              getClassResolver: { args: [], ret: 'java.lang.String', desc: 'ClassResolver' },
              isUseMDCLogging: { args: [], ret: 'boolean', desc: 'UseMDCLogging' },
              requestBodyAndHeaders: {
                args: [
                  { name: 'p1', type: 'java.lang.String', desc: '' },
                  { name: 'p2', type: 'java.lang.Object', desc: '' },
                  { name: 'p3', type: 'java.util.Map', desc: '' },
                ],
                ret: 'java.lang.Object',
                desc: 'Request body and headers (in out)',
              },
              dumpStatsAsXml: {
                args: [{ name: 'p1', type: 'boolean', desc: '' }],
                ret: 'java.lang.String',
                desc: 'Dumps the statistics as XML',
              },
              getLastExchangeFailureTimestamp: {
                args: [],
                ret: 'java.util.Date',
                desc: 'LastExchangeFailureTimestamp',
              },
              isShutdownNowOnTimeout: { args: [], ret: 'boolean', desc: 'ShutdownNowOnTimeout' },
              isUseBreadcrumb: { args: [], ret: 'boolean', desc: 'UseBreadcrumb' },
              sendBodyAndHeaders: {
                args: [
                  { name: 'p1', type: 'java.lang.String', desc: '' },
                  { name: 'p2', type: 'java.lang.Object', desc: '' },
                  { name: 'p3', type: 'java.util.Map', desc: '' },
                ],
                ret: 'void',
                desc: 'Send body and headers (in only)',
              },
              sendBody: {
                args: [
                  { name: 'p1', type: 'java.lang.String', desc: '' },
                  { name: 'p2', type: 'java.lang.Object', desc: '' },
                ],
                ret: 'void',
                desc: 'Send body (in only)',
              },
              dumpRoutesAsXml: [
                {
                  args: [{ name: 'p1', type: 'boolean', desc: '' }],
                  ret: 'java.lang.String',
                  desc: 'Dumps the routes as XML',
                },
                { args: [], ret: 'java.lang.String', desc: 'Dumps the routes as XML' },
                {
                  args: [
                    { name: 'p1', type: 'boolean', desc: '' },
                    { name: 'p2', type: 'boolean', desc: '' },
                  ],
                  ret: 'java.lang.String',
                  desc: 'Dumps the routes as XML',
                },
              ],
              setTracing: { args: [{ name: 'p1', type: 'java.lang.Boolean', desc: '' }], ret: 'void', desc: 'Tracing' },
              suspend: { args: [], ret: 'void', desc: 'Suspend Camel' },
              getIdleSince: { args: [], ret: 'long', desc: 'IdleSince' },
              canSendToEndpoint: {
                args: [{ name: 'p1', type: 'java.lang.String', desc: '' }],
                ret: 'boolean',
                desc: 'Whether its possible to send to the endpoint (eg the endpoint has a producer)',
              },
              getTracing: { args: [], ret: 'java.lang.Boolean', desc: 'Tracing' },
              setShutdownNowOnTimeout: {
                args: [{ name: 'p1', type: 'boolean', desc: '' }],
                ret: 'void',
                desc: 'ShutdownNowOnTimeout',
              },
              removeEndpoints: {
                args: [{ name: 'p1', type: 'java.lang.String', desc: '' }],
                ret: 'int',
                desc: 'Removes endpoints by the given pattern',
              },
              dumpRoutesAsYaml: [
                {
                  args: [
                    { name: 'p1', type: 'boolean', desc: '' },
                    { name: 'p2', type: 'boolean', desc: '' },
                  ],
                  ret: 'java.lang.String',
                  desc: 'Dumps the routes as YAML',
                },
                { args: [], ret: 'java.lang.String', desc: 'Dumps the routes as YAML' },
                {
                  args: [
                    { name: 'p1', type: 'boolean', desc: '' },
                    { name: 'p2', type: 'boolean', desc: '' },
                    { name: 'p3', type: 'boolean', desc: '' },
                  ],
                  ret: 'java.lang.String',
                  desc: 'Dumps the routes as YAML',
                },
                {
                  args: [{ name: 'p1', type: 'boolean', desc: '' }],
                  ret: 'java.lang.String',
                  desc: 'Dumps the routes as YAML',
                },
              ],
              getMinProcessingTime: { args: [], ret: 'long', desc: 'MinProcessingTime' },
              languageNames: {
                args: [],
                ret: 'java.util.Set',
                desc: 'The names of the languages currently registered',
              },
              startAllRoutes: { args: [], ret: 'void', desc: 'Starts all the routes which currently is not started' },
              setGlobalOption: {
                args: [
                  { name: 'p1', type: 'java.lang.String', desc: '' },
                  { name: 'p2', type: 'java.lang.String', desc: '' },
                ],
                ret: 'void',
                desc: 'Sets the value of a Camel global option',
              },
              getProfile: { args: [], ret: 'java.lang.String', desc: 'Profile' },
              getLoad15: { args: [], ret: 'java.lang.String', desc: 'Load15' },
              getRemoteExchangesCompleted: { args: [], ret: 'long', desc: 'RemoteExchangesCompleted' },
              getExchangesTotal: { args: [], ret: 'long', desc: 'ExchangesTotal' },
              getCamelId: { args: [], ret: 'java.lang.String', desc: 'CamelId' },
              setTimeUnit: {
                args: [{ name: 'p1', type: 'java.util.concurrent.TimeUnit', desc: '' }],
                ret: 'void',
                desc: 'TimeUnit',
              },
              stop: { args: [], ret: 'void', desc: 'Stop Camel (shutdown)' },
              getGlobalOptions: { args: [], ret: 'java.util.Map', desc: 'GlobalOptions' },
              reset: [
                { args: [], ret: 'void', desc: 'Reset counters' },
                { args: [{ name: 'p1', type: 'boolean', desc: '' }], ret: 'void', desc: 'Reset counters' },
              ],
              getFirstExchangeCompletedExchangeId: {
                args: [],
                ret: 'java.lang.String',
                desc: 'FirstExchangeCompletedExchangeId',
              },
              getLastExchangeCompletedTimestamp: {
                args: [],
                ret: 'java.util.Date',
                desc: 'LastExchangeCompletedTimestamp',
              },
              getUptime: { args: [], ret: 'java.lang.String', desc: 'Uptime' },
              getManagementName: { args: [], ret: 'java.lang.String', desc: 'ManagementName' },
              getHeadersMapFactoryClassName: { args: [], ret: 'java.lang.String', desc: 'HeadersMapFactoryClassName' },
              getTotalProcessingTime: { args: [], ret: 'long', desc: 'TotalProcessingTime' },
              getRemoteExchangesInflight: { args: [], ret: 'long', desc: 'RemoteExchangesInflight' },
              dataFormatNames: {
                args: [],
                ret: 'java.util.Set',
                desc: 'The names of the data formats currently registered',
              },
              getCamelDescription: { args: [], ret: 'java.lang.String', desc: 'CamelDescription' },
              dumpRoutesStatsAsXml: {
                args: [
                  { name: 'p1', type: 'boolean', desc: '' },
                  { name: 'p2', type: 'boolean', desc: '' },
                ],
                ret: 'java.lang.String',
                desc: 'Dumps the CamelContext and routes stats as XML',
              },
              getLastExchangeCreatedTimestamp: {
                args: [],
                ret: 'java.util.Date',
                desc: 'LastExchangeCreatedTimestamp',
              },
              dumpRoutesCoverageAsXml: { args: [], ret: 'java.lang.String', desc: 'Dumps the routes coverage as XML' },
              requestStringBody: {
                args: [
                  { name: 'p1', type: 'java.lang.String', desc: '' },
                  { name: 'p2', type: 'java.lang.String', desc: '' },
                ],
                ret: 'java.lang.Object',
                desc: 'Request body (String type) (in out)',
              },
              getLoad05: { args: [], ret: 'java.lang.String', desc: 'Load05' },
              getFirstExchangeCompletedTimestamp: {
                args: [],
                ret: 'java.util.Date',
                desc: 'FirstExchangeCompletedTimestamp',
              },
              getThroughput: { args: [], ret: 'java.lang.String', desc: 'Throughput' },
              getRemoteExchangesFailed: { args: [], ret: 'long', desc: 'RemoteExchangesFailed' },
              getLastExchangeFailureExchangeId: {
                args: [],
                ret: 'java.lang.String',
                desc: 'LastExchangeFailureExchangeId',
              },
              isUseDataType: { args: [], ret: 'boolean', desc: 'UseDataType' },
              getMaxProcessingTime: { args: [], ret: 'long', desc: 'MaxProcessingTime' },
              requestBody: {
                args: [
                  { name: 'p1', type: 'java.lang.String', desc: '' },
                  { name: 'p2', type: 'java.lang.Object', desc: '' },
                ],
                ret: 'java.lang.Object',
                desc: 'Request body (in out)',
              },
              isMessageHistory: { args: [], ret: 'boolean', desc: 'MessageHistory' },
              getPackageScanClassResolver: { args: [], ret: 'java.lang.String', desc: 'PackageScanClassResolver' },
              getLastExchangeCompletedExchangeId: {
                args: [],
                ret: 'java.lang.String',
                desc: 'LastExchangeCompletedExchangeId',
              },
              getTimeout: { args: [], ret: 'long', desc: 'Timeout' },
              setStatisticsEnabled: {
                args: [{ name: 'p1', type: 'boolean', desc: '' }],
                ret: 'void',
                desc: 'StatisticsEnabled',
              },
              isAllowUseOriginalMessage: { args: [], ret: 'boolean', desc: 'AllowUseOriginalMessage' },
              getUptimeMillis: { args: [], ret: 'long', desc: 'UptimeMillis' },
              getRemoteExchangesTotal: { args: [], ret: 'long', desc: 'RemoteExchangesTotal' },
              resume: { args: [], ret: 'void', desc: 'Resume Camel' },
              getMeanProcessingTime: { args: [], ret: 'long', desc: 'MeanProcessingTime' },
              getApplicationContextClassName: {
                args: [],
                ret: 'java.lang.String',
                desc: 'ApplicationContextClassName',
              },
              restart: { args: [], ret: 'void', desc: 'Restart Camel (stop and then start)' },
              dumpRouteTemplatesAsXml: { args: [], ret: 'java.lang.String', desc: 'Dumps the route templates as XML' },
              getExternalRedeliveries: { args: [], ret: 'long', desc: 'ExternalRedeliveries' },
              start: { args: [], ret: 'void', desc: 'Start Camel' },
              getFirstExchangeFailureExchangeId: {
                args: [],
                ret: 'java.lang.String',
                desc: 'FirstExchangeFailureExchangeId',
              },
              getResetTimestamp: { args: [], ret: 'java.util.Date', desc: 'ResetTimestamp' },
              getExchangesFailed: { args: [], ret: 'long', desc: 'ExchangesFailed' },
              getStartedRoutes: { args: [], ret: 'java.lang.Integer', desc: 'StartedRoutes' },
              getTimeUnit: { args: [], ret: 'java.util.concurrent.TimeUnit', desc: 'TimeUnit' },
              getLoad01: { args: [], ret: 'java.lang.String', desc: 'Load01' },
              setTimeout: { args: [{ name: 'p1', type: 'long', desc: '' }], ret: 'void', desc: 'Timeout' },
              getState: { args: [], ret: 'java.lang.String', desc: 'State' },
              createEndpoint: {
                args: [{ name: 'p1', type: 'java.lang.String', desc: '' }],
                ret: 'boolean',
                desc: 'Creates the endpoint by the given URI',
              },
              getFailuresHandled: { args: [], ret: 'long', desc: 'FailuresHandled' },
              getExchangesInflight: { args: [], ret: 'long', desc: 'ExchangesInflight' },
              getManagementStatisticsLevel: { args: [], ret: 'java.lang.String', desc: 'ManagementStatisticsLevel' },
              getGlobalOption: {
                args: [{ name: 'p1', type: 'java.lang.String', desc: '' }],
                ret: 'java.lang.String',
                desc: 'Gets the value of a Camel global option',
              },
              getRedeliveries: { args: [], ret: 'long', desc: 'Redeliveries' },
              getTotalRoutes: { args: [], ret: 'java.lang.Integer', desc: 'TotalRoutes' },
              isStatisticsEnabled: { args: [], ret: 'boolean', desc: 'StatisticsEnabled' },
              componentNames: {
                args: [],
                ret: 'java.util.Set',
                desc: 'The names of the components currently registered',
              },
              getFirstExchangeFailureTimestamp: {
                args: [],
                ret: 'java.util.Date',
                desc: 'FirstExchangeFailureTimestamp',
              },
              sendStringBody: {
                args: [
                  { name: 'p1', type: 'java.lang.String', desc: '' },
                  { name: 'p2', type: 'java.lang.String', desc: '' },
                ],
                ret: 'void',
                desc: 'Send body (String type) (in only)',
              },
            },
            attr: {
              StatisticsEnabled: { rw: true, type: 'boolean', desc: 'Statistics enabled' },
              UseMDCLogging: { rw: false, type: 'boolean', desc: 'Whether MDC logging is supported' },
              ExchangesFailed: { rw: false, type: 'long', desc: 'Number of failed exchanges' },
              RemoteExchangesInflight: {
                rw: false,
                type: 'long',
                desc: 'Total number of exchanges inflight from remote endpoints only',
              },
              FirstExchangeCompletedExchangeId: {
                rw: false,
                type: 'java.lang.String',
                desc: 'First Exchange Completed ExchangeId',
              },
              StartTimestamp: {
                rw: false,
                type: 'java.util.Date',
                desc: 'Timestamp when the stats was initially started',
              },
              FirstExchangeCompletedTimestamp: {
                rw: false,
                type: 'java.util.Date',
                desc: 'First Exchange Completed Timestamp',
              },
              CamelDescription: { rw: false, type: 'java.lang.String', desc: 'Camel Description' },
              IdleSince: {
                rw: false,
                type: 'long',
                desc: 'Time in millis being idle (no messages incoming or inflight)',
              },
              DeltaProcessingTime: { rw: false, type: 'long', desc: 'Delta Processing Time [milliseconds]' },
              TotalRoutes: { rw: false, type: 'java.lang.Integer', desc: 'Total number of routes' },
              ExternalRedeliveries: {
                rw: false,
                type: 'long',
                desc: 'Number of external initiated redeliveries (such as from JMS broker)',
              },
              UseBreadcrumb: { rw: false, type: 'boolean', desc: 'Whether breadcrumbs is in use' },
              TimeUnit: { rw: true, type: 'java.util.concurrent.TimeUnit', desc: 'Shutdown timeout time unit' },
              UptimeMillis: { rw: false, type: 'long', desc: 'Uptime [milliseconds]' },
              LastExchangeCreatedTimestamp: {
                rw: false,
                type: 'java.util.Date',
                desc: 'Last Exchange Created Timestamp',
              },
              ExchangesTotal: { rw: false, type: 'long', desc: 'Total number of exchanges' },
              ExchangesInflight: { rw: false, type: 'long', desc: 'Number of inflight exchanges' },
              MeanProcessingTime: { rw: false, type: 'long', desc: 'Mean Processing Time [milliseconds]' },
              LastExchangeFailureExchangeId: {
                rw: false,
                type: 'java.lang.String',
                desc: 'Last Exchange Failed ExchangeId',
              },
              LogMask: { rw: false, type: 'boolean', desc: 'Whether security mask for Logging is enabled' },
              FirstExchangeFailureExchangeId: {
                rw: false,
                type: 'java.lang.String',
                desc: 'First Exchange Failed ExchangeId',
              },
              Timeout: { rw: true, type: 'long', desc: 'Shutdown timeout' },
              CamelId: { rw: false, type: 'java.lang.String', desc: 'Camel ID' },
              TotalProcessingTime: { rw: false, type: 'long', desc: 'Total Processing Time [milliseconds]' },
              AllowUseOriginalMessage: {
                rw: false,
                type: 'boolean',
                desc: 'Whether allowing access to the original message during routing',
              },
              FailuresHandled: { rw: false, type: 'long', desc: 'Number of failures handled' },
              MessageHistory: { rw: false, type: 'boolean', desc: 'Whether message history is enabled' },
              State: { rw: false, type: 'java.lang.String', desc: 'Camel State' },
              Tracing: { rw: true, type: 'java.lang.Boolean', desc: 'Tracing' },
              RemoteExchangesCompleted: {
                rw: false,
                type: 'long',
                desc: 'Completed (success) number of exchanges processed from remote endpoints only',
              },
              ExchangesCompleted: { rw: false, type: 'long', desc: 'Number of completed exchanges' },
              LastProcessingTime: { rw: false, type: 'long', desc: 'Last Processing Time [milliseconds]' },
              HeadersMapFactoryClassName: { rw: false, type: 'java.lang.String', desc: 'HeadersMapFactory class name' },
              Throughput: { rw: false, type: 'java.lang.String', desc: 'Throughput message/second' },
              LastExchangeFailureTimestamp: {
                rw: false,
                type: 'java.util.Date',
                desc: 'Last Exchange Failed Timestamp',
              },
              Profile: { rw: false, type: 'java.lang.String', desc: 'Camel Profile' },
              MaxProcessingTime: { rw: false, type: 'long', desc: 'Max Processing Time [milliseconds]' },
              LastExchangeCompletedTimestamp: {
                rw: false,
                type: 'java.util.Date',
                desc: 'Last Exchange Completed Timestamp',
              },
              Load15: { rw: false, type: 'java.lang.String', desc: 'Average load over the last fifteen minutes' },
              ApplicationContextClassName: {
                rw: false,
                type: 'java.lang.String',
                desc: 'ApplicationContext class name',
              },
              StartedRoutes: { rw: false, type: 'java.lang.Integer', desc: 'Current number of started routes' },
              ManagementName: { rw: false, type: 'java.lang.String', desc: 'Camel ManagementName' },
              ClassResolver: { rw: false, type: 'java.lang.String', desc: 'ClassResolver class name' },
              RemoteExchangesFailed: {
                rw: false,
                type: 'long',
                desc: 'Failed number of exchanges processed from remote endpoints only',
              },
              GlobalOptions: { rw: false, type: 'java.util.Map', desc: 'Camel Global Options' },
              ResetTimestamp: {
                rw: false,
                type: 'java.util.Date',
                desc: 'Timestamp when the stats was last reset or initially started',
              },
              UseDataType: { rw: false, type: 'boolean', desc: 'Whether Message DataType is enabled' },
              Uptime: { rw: false, type: 'java.lang.String', desc: 'Uptime [human readable text]' },
              FirstExchangeFailureTimestamp: {
                rw: false,
                type: 'java.util.Date',
                desc: 'First Exchange Failed Timestamp',
              },
              ShutdownNowOnTimeout: {
                rw: true,
                type: 'boolean',
                desc: 'Whether to force shutdown now when a timeout occurred',
              },
              Load05: { rw: false, type: 'java.lang.String', desc: 'Average load over the last five minutes' },
              PackageScanClassResolver: {
                rw: false,
                type: 'java.lang.String',
                desc: 'PackageScanClassResolver class name',
              },
              CamelVersion: { rw: false, type: 'java.lang.String', desc: 'Camel Version' },
              Redeliveries: { rw: false, type: 'long', desc: 'Number of redeliveries (internal only)' },
              MinProcessingTime: { rw: false, type: 'long', desc: 'Min Processing Time [milliseconds]' },
              LastExchangeCompletedExchangeId: {
                rw: false,
                type: 'java.lang.String',
                desc: 'Last Exchange Completed ExchangeId',
              },
              RemoteExchangesTotal: {
                rw: false,
                type: 'long',
                desc: 'Total number of exchanges processed from remote endpoints only',
              },
              ManagementStatisticsLevel: {
                rw: false,
                type: 'java.lang.String',
                desc: 'Camel Management StatisticsLevel',
              },
              Load01: { rw: false, type: 'java.lang.String', desc: 'Average load over the last minute' },
            },
            class: 'org.apache.camel.management.mbean.ManagedCamelContext',
            desc: 'Managed CamelContext',
          },
        },
      },
    }
    const domains = jolokiaService.unwindListResponse(response.value)
    expect(Object.keys(domains)).toHaveLength(1)
    const domain = domains['org.apache.camel']
    expect(domain).not.toBeUndefined()
    const mbean = domain!['context=hello,type=context,name="hello"']
    expect(mbean).not.toBeUndefined()
  })

  test('problematic JSON response from case hawtio/hawtio-react#902', () => {
    const response = {
      value: {
        'java.util.logging': {
          'type=Logging': {
            class: 'sun.management.ManagementFactoryHelper$PlatformLoggingImpl',
            desc: 'Information on the management interface of the MBean',
          },
        },
        'my-domain-with-vanishing-mbeans': {
          'type=Bean1': {
            error: 'javax.management.InstanceNotFoundException: Bean1',
          },
        },
      },
    }
    expect(() => jolokiaService.unwindListResponse(response.value)).not.toThrow()
  })

  test('problematic JSON response with null desc from case hawtio/hawtio-react#1349', () => {
    const response = {
      value: {
        Tomcat: {
          'type=StringCache': {
            op: {
              reset: {
                args: [],
                ret: 'void',
                desc: 'Introspected operation reset',
              },
            },
            attr: {
              accessCount: {
                rw: false,
                type: 'int',
                desc: 'Introspected attribute accessCount',
              },
            },
            class: 'org.apache.tomcat.util.modeler.BaseModelMBean',
            desc: null,
          },
        },
      },
    }
    expect(() => jolokiaService.unwindListResponse(response.value)).not.toThrow()
  })
})
