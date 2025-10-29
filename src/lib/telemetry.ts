const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

function resolveEndpoint(path: string) {
  const normalizedBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

export type TelemetryEventPayload = {
  feature: string
  action: string
  value?: string | number | boolean | null
  [key: string]: unknown
}

interface EnrichedTelemetryEvent extends TelemetryEventPayload {
  timestamp: string
  url: string
  userAgent?: string
  language?: string
  viewport?: { width: number; height: number }
  timezone?: string
  referrer?: string
}

const BATCH_INTERVAL = 5_000
const MAX_BATCH_SIZE = 25
const ENDPOINT = resolveEndpoint('/telemetry')

export type TelemetryClient = {
  track: (event: TelemetryEventPayload) => void
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

class InternalTelemetryClient implements TelemetryClient {
  private queue: EnrichedTelemetryEvent[] = []
  private flushTimeout: ReturnType<typeof setTimeout> | null = null

  constructor() {
    if (isBrowser()) {
      const flushWhenHidden = () => {
        if (document.visibilityState === 'hidden') {
          this.flushQueue()
        }
      }
      window.addEventListener('beforeunload', () => this.flushQueue())
      window.addEventListener('pagehide', () => this.flushQueue())
      document.addEventListener('visibilitychange', flushWhenHidden)
    }
  }

  track(event: TelemetryEventPayload) {
    if (!isBrowser()) return

    const enrichedEvent: EnrichedTelemetryEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      language: navigator.language,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      referrer: document.referrer || undefined,
    }

    this.queue.push(enrichedEvent)

    if (this.queue.length >= MAX_BATCH_SIZE) {
      this.flushQueue()
      return
    }

    if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => this.flushQueue(), BATCH_INTERVAL)
    }
  }

  private flushQueue() {
    if (!this.queue.length) {
      this.clearTimer()
      return
    }

    const eventsToSend = [...this.queue]
    this.queue = []
    this.clearTimer()
    this.sendBatch(eventsToSend)
  }

  private clearTimer() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout)
      this.flushTimeout = null
    }
  }

  private sendBatch(events: EnrichedTelemetryEvent[]) {
    if (!isBrowser()) return

    const token = this.getToken()
    const body = JSON.stringify({
      events,
      authToken: token ?? undefined,
      sentAt: new Date().toISOString(),
    })

    const canUseBeacon = typeof navigator.sendBeacon === 'function'
    const beaconSent = canUseBeacon ? navigator.sendBeacon(ENDPOINT, body) : false

    if (beaconSent) {
      return
    }

    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    fetch(ENDPOINT, {
      method: 'POST',
      headers,
      body,
      keepalive: true,
    }).catch(() => {
      // Swallow network errors; telemetry should never block the UI.
    })
  }

  private getToken(): string | null {
    try {
      return window.localStorage.getItem('schedule_viewer_token')
    } catch (error) {
      console.warn('Unable to access schedule_viewer_token', error)
      return null
    }
  }
}

let sharedClient: InternalTelemetryClient | null = null

function ensureClient(): InternalTelemetryClient | null {
  if (!isBrowser()) return null
  if (!sharedClient) {
    sharedClient = new InternalTelemetryClient()
  }
  return sharedClient
}

export function getTelemetryClient(): TelemetryClient | null {
  return ensureClient()
}

export function trackClientEvent(event: TelemetryEventPayload) {
  ensureClient()?.track(event)
}
