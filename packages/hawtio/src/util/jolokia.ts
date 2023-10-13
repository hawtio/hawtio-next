import { Logger } from '@hawtiosrc/core/logging'
import {
  AttributeRequestOptions,
  BaseRequestOptions,
  BulkRequestOptions,
  ErrorResponse,
  ExecuteRequestOptions,
  ListRequestOptions,
  MBeanOperationArgument,
  RequestOptions,
  SearchRequestOptions,
  VersionRequestOptions,
} from 'jolokia.js'

const log = Logger.get('hawtio-util')

export function onSuccessAndError(
  successFn: NonNullable<RequestOptions['success']>,
  errorFn: NonNullable<RequestOptions['error']>,
  options: BaseRequestOptions = {},
): RequestOptions {
  return onGenericSuccessAndError(successFn, errorFn, options)
}

export function onAttributeSuccessAndError(
  successFn: NonNullable<AttributeRequestOptions['success']>,
  errorFn: NonNullable<AttributeRequestOptions['error']>,
  options: AttributeRequestOptions = {},
): AttributeRequestOptions {
  return onGenericSuccessAndError(successFn, errorFn, options)
}

export function onExecuteSuccessAndError(
  successFn: NonNullable<ExecuteRequestOptions['success']>,
  errorFn: NonNullable<ExecuteRequestOptions['error']>,
  options: ExecuteRequestOptions = {},
): ExecuteRequestOptions {
  return onGenericSuccessAndError(successFn, errorFn, options)
}

export function onSearchSuccessAndError(
  successFn: NonNullable<SearchRequestOptions['success']>,
  errorFn: NonNullable<SearchRequestOptions['error']>,
  options: SearchRequestOptions = {},
): SearchRequestOptions {
  return onGenericSuccessAndError(successFn, errorFn, options)
}

export function onListSuccessAndError(
  successFn: NonNullable<ListRequestOptions['success']>,
  errorFn: NonNullable<ListRequestOptions['error']>,
  options: ListRequestOptions = {},
): ListRequestOptions {
  return onGenericSuccessAndError(successFn, errorFn, options)
}

export function onVersionSuccessAndError(
  successFn: NonNullable<VersionRequestOptions['success']>,
  errorFn: NonNullable<VersionRequestOptions['error']>,
  options: VersionRequestOptions = {},
): VersionRequestOptions {
  return onGenericSuccessAndError(successFn, errorFn, options)
}

export function onBulkSuccessAndError(
  successFn: NonNullable<BulkRequestOptions['success']>,
  errorFn: NonNullable<BulkRequestOptions['error']>,
  options: BulkRequestOptions = {},
): BulkRequestOptions {
  return onGenericSuccessAndError(successFn, errorFn, options)
}

export function onGenericSuccess<S, O extends BaseRequestOptions>(successFn: S, options?: O): O {
  return onGenericSuccessAndError(successFn, defaultErrorHandler(), options)
}

export function onGenericSuccessAndError<S, E, O extends BaseRequestOptions>(successFn: S, errorFn: E, options?: O): O {
  const defaultOptions: BaseRequestOptions = {
    method: 'post',
    mimeType: 'application/json',
    // the default (unsorted) order is important for Karaf runtime
    canonicalNaming: false,
  }
  return Object.assign({}, defaultOptions, options, {
    success: successFn,
    error: errorFn,
  })
}

/**
 * The default error handler which logs errors either using debug or log level logging
 * based on the silent setting.
 */
function defaultErrorHandler(): NonNullable<RequestOptions['error']> {
  return (response: ErrorResponse) => {
    if (!response.error) {
      return
    }

    const req = response.request
    const operation = req?.type === 'exec' ? req.operation : 'unknown'
    if (isIgnorableException(response)) {
      log.debug('Operation', operation, 'failed due to:', response.error)
    } else {
      log.warn('Operation', operation, 'failed due to:', response.error)
    }
  }
}

/**
 * Checks if it's an error that can happen on timing issues such as being removed
 * or if we run against older containers.
 *
 * @param response the error response from a Jolokia request
 */
function isIgnorableException(response: ErrorResponse): boolean {
  const ignorables = [
    'InstanceNotFoundException',
    'AttributeNotFoundException',
    'IllegalArgumentException: No operation',
  ]
  const test = (e: string) => ignorables.some(i => e.indexOf(i) >= 0)
  return (response.stacktrace != null && test(response.stacktrace)) || (response.error != null && test(response.error))
}

/**
 * Escapes the mbean for Jolokia GET requests.
 *
 * @param mbean the MBean
 */
export function escapeMBean(mbean: string): string {
  return encodeURI(applyJolokiaEscapeRules(mbean))
}

/**
 * Escapes the MBean as a path for Jolokia POST "list" requests.
 * See: https://jolokia.org/reference/html/protocol.html#list
 *
 * @param mbean the MBean
 */
export function escapeMBeanPath(mbean: string): string {
  return applyJolokiaEscapeRules(mbean).replace(':', '/')
}

/**
 * Applies the Jolokia escaping rules to the MBean name.
 * See: http://www.jolokia.org/reference/html/protocol.html#escape-rules
 *
 * @param mbean the MBean
 */
function applyJolokiaEscapeRules(mbean: string): string {
  return mbean.replace(/!/g, '!!').replace(/\//g, '!/').replace(/"/g, '!"')
}

export function operationToString(operation: string, args: MBeanOperationArgument[]): string {
  const argsStr = args.map(arg => arg.type).join(',')
  return `${operation}(${argsStr})`
}
