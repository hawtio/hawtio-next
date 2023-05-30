import { log } from './globals'

export type FetchPathCallback<T> = {
  success: (data: string) => T
  error: () => T
}

export async function fetchPath<T>(path: string, callback: FetchPathCallback<T>): Promise<T> {
  try {
    const res = await fetch(path)
    if (!res.ok) {
      log.error('Failed to fetch', path, ':', res.status, res.statusText)
      return callback.error()
    }

    const data = await res.text()
    return callback.success(data)
  } catch (err) {
    log.error('Failed to fetch', path, ':', err)
    return callback.error()
  }
}
