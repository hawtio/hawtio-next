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
