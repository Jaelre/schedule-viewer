import { resolveApiUrl, withViewerCredentials } from './api-base'

function resolveEndpoint(path: string) {
  return resolveApiUrl(path)
}

export type TelemetryEventPayload = {
  feature: string
  action: string
  value?: string | number | boolean | null
  [key: string]: unknown
}

export interface ClientTelemetryContext {
  url: string
  language?: string
  viewport?: { width: number; height: number }
  timezone?: string
  referrer?: string
  schedule_viewer_release?: string
}

interface EnrichedTelemetryEvent extends TelemetryEventPayload, ClientTelemetryContext {
  timestamp: string
}

const BATCH_INTERVAL = 5_000
const MAX_BATCH_SIZE = 25
const ENDPOINT = resolveEndpoint('/telemetry')
const SCHEDULE_VIEWER_RELEASE =
  process.env.NEXT_PUBLIC_SCHEDULE_VIEWER_RELEASE?.trim() || undefined

export type TelemetryClient = {
  track: (event: TelemetryEventPayload) => void
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function getCurrentPath(): string {
  if (!isBrowser()) return '/'

  const { pathname, search } = window.location
  return `${pathname}${search}`
}

function getSameOriginReferrerPath(): string | undefined {
  if (!isBrowser() || !document.referrer) {
    return undefined
  }

  try {
    const referrerUrl = new URL(document.referrer)
    if (referrerUrl.origin !== window.location.origin) {
      return undefined
    }

    return `${referrerUrl.pathname}${referrerUrl.search}`
  } catch {
    return undefined
  }
}

export function getClientTelemetryContext(): ClientTelemetryContext {
  if (!isBrowser()) {
    return { url: '/' }
  }

  const context: ClientTelemetryContext = {
    url: getCurrentPath(),
    language: navigator.language,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    referrer: getSameOriginReferrerPath(),
  }

  if (SCHEDULE_VIEWER_RELEASE) {
    context.schedule_viewer_release = SCHEDULE_VIEWER_RELEASE
  }

  return context
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
      ...getClientTelemetryContext(),
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

    // Try sendBeacon first; the worker authenticates via the first-party session cookie.
    const canUseBeacon = typeof navigator.sendBeacon === 'function'
    if (canUseBeacon) {
      const beaconBody = JSON.stringify({
        events,
        flush: true, // Force immediate flush in serverless environment
      })
      const beaconSent = navigator.sendBeacon(ENDPOINT, beaconBody)
      if (beaconSent) {
        return
      }
    }

    const fetchBody = JSON.stringify({
      events,
      flush: true, // Force immediate flush in serverless environment
    })

    fetch(
      ENDPOINT,
      withViewerCredentials({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: fetchBody,
        keepalive: true,
      })
    ).catch(() => {
      // Swallow network errors; telemetry should never block the UI.
    })
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
