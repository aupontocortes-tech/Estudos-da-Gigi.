/** Helpers para PWA em dev (localhost, rede local, HTTPS). */

export function normalizeHostname(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, '')
}

export function isLoopbackHost(hostname: string): boolean {
  const h = normalizeHostname(hostname)
  return h === 'localhost' || h === '127.0.0.1' || h === '::1'
}

export function isPrivateLanHost(hostname: string): boolean {
  const h = normalizeHostname(hostname)
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(h)) return true
  return false
}
