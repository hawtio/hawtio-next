import { isBlank } from './strings'

/**
 * Join the supplied strings together using '/', stripping any leading/ending '/'
 * from the supplied strings if needed, except the first and last string.
 */
export function joinPaths(...paths: string[]): string {
  const tmp: string[] = []
  paths.forEach((path, index) => {
    if (isBlank(path)) {
      return
    }
    if (path === '/') {
      tmp.push('')
      return
    }
    if (index !== 0 && path.match(/^\//)) {
      path = path.slice(1)
    }
    if (index < paths.length - 1 && path.match(/\/$/)) {
      path = path.slice(0, path.length - 1)
    }
    if (!isBlank(path)) {
      tmp.push(path)
    }
  })
  return tmp.join('/')
}

/**
 * Gets a query value from the given URL.
 *
 * @param url URL
 * @param parameterName the URI parameter value to get
 * @returns the URI-decoded parameter value
 */
export function getQueryParameterValue(url: string, parameterName: string): string | null {
  const query = url.split('?')[1] ?? ''
  const params = query.split('&') ?? []
  const value = params
    .map(param => param.split('='))
    .find(([key, _]) => key && decodeURIComponent(key) === parameterName)?.[1]
  return value ? decodeURIComponent(value) : null
}
