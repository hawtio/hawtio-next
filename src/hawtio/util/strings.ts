export function isString(value: unknown): boolean {
  if (value != null && typeof value.valueOf() === 'string') {
    return true
  }
  return false
}

/**
 * Return true if the string is either null or empty.
 */
export function isBlank(str: string): boolean {
  if (str === undefined || str === null) {
    return true
  }
  if (typeof str !== 'string') {
    // not null but also not a string...
    return false
  }

  return str.trim().length === 0
}

/**
* Simple toString that obscures any field called 'password'.
*/
export function toString(obj: unknown): string {
  if (!obj) {
    return '{}'
  }

  const strs = Object.entries(obj).map(([key, value]) => {
    let obscured = value
    if (key.toLowerCase() === 'password') {
      obscured = obfuscate(value)
    } else if (typeof value === 'object') {
      obscured = toString(obscured)
    }
    return `${key}: ${obscured}`
  })
  return `{ ${strs.join(', ')} }`
}

/**
 * Convert a string into a bunch of '*' of the same length.
 */
export function obfuscate(str: string): string {
  if (typeof str !== 'string') {
    return ''
  }
  return str.split('').map(() => '*').join('')
}
