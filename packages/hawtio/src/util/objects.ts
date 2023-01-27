export function isObject(value: unknown): value is object {
  const type = typeof value
  return value != null && (type == 'object' || type == 'function')
}

export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0
}
