export function moveElement<T>(target: T[], value: T, dest: number) {
  const idx = target.indexOf(value)
  if (idx < 0) return // Nothing to do

  target.splice(idx, 1)
  target.splice(dest, 0, value)
}

export function compareArrays<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false

  for (const v of a) {
    if (!b.includes(v)) return false
  }

  return true
}
