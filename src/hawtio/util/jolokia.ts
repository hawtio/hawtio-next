import { IErrorResponse, IParams, IResponse } from 'jolokia.js'

const log = console

type JolokiaSuccessCallback = (response: IResponse) => void | ((response: IResponse) => void)[]
type JolokiaErrorCallback = (response: IErrorResponse) => void

export function options(onSuccess: JolokiaSuccessCallback, options: IParams = {}): IParams {
  return optionsWithError(
    onSuccess,
    (response: IErrorResponse) => defaultErrorHandler(response, options),
    options)
}

export function optionsWithError(
  onSuccess: JolokiaSuccessCallback,
  onError: JolokiaErrorCallback,
  options: IParams = {}
): IParams {
  const defaultOptions = {
    method: 'POST',
    mimeType: 'application/json',
    // the default (unsorted) order is important for Karaf runtime
    canonicalNaming: false,
    canonicalProperties: false,
  }
  return Object.assign({}, defaultOptions, options, {
    success: onSuccess,
    error: onError,
  })
}

/**
 * The default error handler which logs errors either using debug or log level logging
 * based on the silent setting.
 *
 * @param response the response from a Jolokia request
 */
function defaultErrorHandler(response: IErrorResponse, options: IParams = {}) {
  if (!response.error) {
    return
  }

  const operation = response.request?.operation || 'unknown'
  // silent is a custom option only used in Hawtio
  const silent = options.silent
  if (silent || isIgnorableException(response)) {
    log.debug('Operation', operation, 'failed due to:', response.error)
  } else {
    log.warn('Operation', operation, 'failed due to:', response.error)
  }
}

/**
 * Checks if it's an error that can happen on timing issues such as being removed
 * or if we run against older containers.
 *
 * @param response the error response from a Jolokia request
 */
function isIgnorableException(response: IErrorResponse): boolean {
  const ignorables = [
    'InstanceNotFoundException',
    'AttributeNotFoundException',
    'IllegalArgumentException: No operation',
  ]
  const test = (e: string) => ignorables.some(i => e.indexOf(i) >= 0)
  return (response.stacktrace != null && test(response.stacktrace))
    || (response.error != null && test(response.error))
}

/**
 * Escapes the mbean as a path for Jolokia POST "list" requests.
 * See: https://jolokia.org/reference/html/protocol.html#list
 *
 * @param mbean the mbean
 */
export function escapeMBeanPath(mbean: string): string {
  return applyJolokiaEscapeRules(mbean).replace(':', '/')
}

/**
 * Applies the Jolokia escaping rules to the mbean name.
 * See: http://www.jolokia.org/reference/html/protocol.html#escape-rules
 *
 * @param mbean the mbean
 */
function applyJolokiaEscapeRules(mbean: string): string {
  return mbean
    .replace(/!/g, '!!')
    .replace(/\//g, '!/')
    .replace(/"/g, '!"')
}
