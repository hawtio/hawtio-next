export function basicAuthHeaderValue(username: string, password: string): string {
  const base64UserPass = window.btoa(`${username}:${password}`)
  return `Basic ${base64UserPass}`
}
