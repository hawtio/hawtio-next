export function moveElement<T>(target: T[], value: T, dest: number) {
  const idx = target.indexOf(value)
  if (idx < 0)
    return // Nothing to do

  target.splice(idx, 1)
  target.splice(dest, 0, value)
}
