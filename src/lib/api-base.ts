const DEFAULT_API_BASE = '/api'

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (!configured) {
    return DEFAULT_API_BASE
  }

  const normalized = trimTrailingSlash(configured)
  if (normalized === '' || normalized === '/') {
    return DEFAULT_API_BASE
  }

  return normalized.endsWith('/api') ? normalized : `${normalized}/api`
}

export function resolveApiUrl(path: string): string {
  const normalizedBase = trimTrailingSlash(getApiBaseUrl())
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

export function withViewerCredentials(init: RequestInit = {}): RequestInit {
  return {
    ...init,
    credentials: 'include',
  }
}
