export function formatTimestamp(date: Date, millis = false): string {
  const padZero = (n: number, len = 2) => String(n).padStart(len, '0')

  const year = date.getFullYear()
  const month = padZero(date.getMonth() + 1)
  const day = padZero(date.getDate())
  const hours = padZero(date.getHours())
  const minutes = padZero(date.getMinutes())
  const seconds = padZero(date.getSeconds())
  if (!millis) {
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }
  const milliseconds = padZero(date.getMilliseconds(), 3)
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
}

export function humanizeSeconds(seconds: number): string {
  const humanize = (n: number, unit: string) => {
    const fixed = Number.isInteger(n) ? n : n.toFixed(1)
    return `${fixed} ${unit}` + (n === 1 ? '' : 's')
  }
  if (seconds < 60) {
    return humanize(seconds, 'second')
  }
  if (seconds < 60 * 60) {
    return humanize(seconds / 60, 'minute')
  }
  if (seconds < 60 * 60 * 24) {
    return humanize(seconds / (60 * 60), 'hour')
  }
  return humanize(seconds / (60 * 60 * 24), 'day')
}
