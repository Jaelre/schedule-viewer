'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { TelemetryEventPayload } from '@/lib/telemetry'
import { getTelemetryClient, trackClientEvent } from '@/lib/telemetry'

interface TelemetryContextValue {
  track: (event: TelemetryEventPayload) => void
}

const TelemetryContext = createContext<TelemetryContextValue>({
  track: () => {},
})

export function useTelemetry(): TelemetryContextValue {
  return useContext(TelemetryContext)
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: true,
          },
        },
      })
  )

  const telemetryClient = useMemo(() => getTelemetryClient(), [])
  const track = useMemo(
    () =>
      (event: TelemetryEventPayload) => {
        if (telemetryClient) {
          telemetryClient.track(event)
        } else {
          trackClientEvent(event)
        }
      },
    [telemetryClient]
  )

  const telemetryValue = useMemo<TelemetryContextValue>(() => ({ track }), [track])

  return (
    <TelemetryContext.Provider value={telemetryValue}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </TelemetryContext.Provider>
  )
}
