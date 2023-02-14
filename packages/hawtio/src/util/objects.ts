export function isObject(value: unknown): value is object {
  const type = typeof value
  return value != null && (type === 'object' || type === 'function')
}

export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0
}

/**
 * Navigates the given set of paths in turn on the source object
 * and returns the last most value of the path or null if it could not be found.
 *
 * @method pathGet
 * @static
 * @param {Object} obj the start object to start navigating from
 * @param {Array} paths an array of path names to navigate or a string of dot separated paths to navigate
 * @return {*} the last step on the path which is updated
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pathGet(obj: any, paths: string[]): object {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value:any = obj
  paths.forEach((name) => {
    if (value) {
      try {
        value = value[name]
      } catch (e) {
        // ignore errors
        return
      }
    } else {
      return
    }
  })

  return value
}

export function isString(value: unknown): value is string {
  return typeof value === 'string' || value instanceof String
}
