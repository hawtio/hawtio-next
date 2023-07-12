export function getCookie(name: string): string | null {
  if (name == null) {
    return null
  }
  const cookies = document.cookie.split(';')
  const cookie = cookies.map(cookie => cookie.split('=')).find(cookie => cookie.length > 1 && cookie[0] === name)
  return cookie?.[1] ?? null
}
