export function isObject(value: unknown): value is object {
  const type = typeof value
  return value != null && (type === 'object' || type === 'function')
}

export function cloneObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0
}

export function isString(value: unknown): value is string {
  return value != null && typeof value.valueOf() === 'string'
}

export function isArray<T>(obj: T | T[]): obj is T[] {
  return Array.isArray(obj)
}
