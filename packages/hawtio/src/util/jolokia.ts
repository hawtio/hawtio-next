import { Logger } from '@hawtiosrc/core/logging'

import {
  BaseRequestOptions,
  ErrorCallback,
  JolokiaErrorResponse,
  MBeanOperationArgument,
  RequestOptions,
  ResponseCallback,
} from 'jolokia.js'
import { SimpleRequestOptions, SimpleResponseCallback } from '@jolokia.js/simple'

const log = Logger.get('hawtio-util')

// Hawtio uses both _normal_ and _simple_ Jolokia APIs:
// - _normal_ means generic Jolokia.request() method, where we can pass callbacks accepting entire response object
// - _simple_ means @jolokia.js/simple API, where we can use callbacks accepting just the "value" field of the response

/**
 * _normal_ configuration object to handle `read` and `write` operations using `Jolokia.request()` generic call
 * @param successFn
 * @param errorFn
 * @param options
 */
export function onAttributeSuccessAndError(
  successFn: ResponseCallback,
  errorFn: ErrorCallback,
  options: RequestOptions = {},
): RequestOptions {
  return onGenericSuccessAndError(successFn, errorFn, options)
}

/**
 * _simple_ configuration object to handle `exec` Jolokia operation using Jolokia Simple API call
 * @param successFn
 * @param errorFn
 * @param options
 */
export function onExecuteSuccessAndError(
  successFn: SimpleResponseCallback,
  errorFn: ErrorCallback,
  options: SimpleRequestOptions = {},
): SimpleRequestOptions {
  return onGenericSuccessAndError(successFn, errorFn, options)
}

/**
 * _simple_ configuration object to handle `search` Jolokia operation using Jolokia Simple API call
 * @param successFn
 * @param errorFn
 * @param options
 */
export function onSearchSuccessAndError(
  successFn: SimpleResponseCallback,
  errorFn: ErrorCallback,
  options: SimpleRequestOptions = {},
): SimpleRequestOptions {
  return onGenericSuccessAndError(successFn, errorFn, options)
}

/**
 * _simple_ configuration object to handle `list` Jolokia operation using Jolokia Simple API call
 * @param successFn
 * @param errorFn
 * @param options
 */
export function onListSuccessAndError(
  successFn: SimpleResponseCallback,
  errorFn: ErrorCallback,
  options: SimpleRequestOptions = {},
): SimpleRequestOptions {
  return onGenericSuccessAndError(successFn, errorFn, options)
}

/**
 * _simple_ configuration object to handle `version` Jolokia operation using Jolokia Simple API call
 * @param successFn
 * @param errorFn
 * @param options
 */
export function onVersionSuccessAndError(
  successFn: SimpleResponseCallback,
  errorFn: ErrorCallback,
  options: SimpleRequestOptions = {},
): SimpleRequestOptions {
  return onGenericSuccessAndError(successFn, errorFn, options)
}

export function onBulkSuccessAndError(
  successFn: NonNullable<RequestOptions['success']>,
  errorFn: NonNullable<RequestOptions['error']>,
  options: RequestOptions = {},
): RequestOptions {
  return onGenericSuccessAndError(successFn, errorFn, options)
}

/**
 * Configuration factory to prepare Jolokia configuration object with default Jolokia error handler
 * @param successFn a callback function to handle successful Jolokia response
 * @param options simple or normal (full) Jolokia configuration option object
 */
export function onGenericSuccess<S, O extends BaseRequestOptions>(successFn: S, options?: O): O {
  return onGenericSuccessAndError(successFn, defaultErrorHandler(), options)
}

/**
 * Generic configuration factory, which deals both with simple and normal Jolokia configurations
 * @param successFn a callback function to handle successful Jolokia response
 * @param errorFn a callback function to handle error Jolokia response (but still HTTP == 200)
 * @param options simple or normal (full) Jolokia configuration option object
 */
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
function defaultErrorHandler(): ErrorCallback {
  return (response: JolokiaErrorResponse, _index: number) => {
    if (!response.error) {
      return
    }

    const req = response.request
    const operation = req?.type === 'exec' ? 'exec/' + req.operation : req ? req.type : 'unknown'
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
function isIgnorableException(response: JolokiaErrorResponse): boolean {
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
 * See: https://jolokia.org/reference/html/manual/jolokia_protocol.html#list
 *
 * @param mbean the MBean
 */
export function escapeMBeanPath(mbean: string): string {
  return applyJolokiaEscapeRules(mbean).replace(':', '/')
}

/**
 * Applies the Jolokia escaping rules to the MBean name.
 * See: https://jolokia.org/reference/html/manual/jolokia_protocol.html#_escaping_rules_in_get_requests
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
