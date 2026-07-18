'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getCurrentYM, isValidYM } from '@/lib/date'
import { useMonthShifts } from '@/lib/api-client'
import { RuntimeConfigProvider, useRuntimeConfig } from '@/lib/config/runtime-config'
import { MonthNav } from './MonthNav'
import { DensityToggle, type Density } from './DensityToggle'
import { ScheduleGrid } from './ScheduleGrid'
import type { ViewMode } from './ScheduleGrid/types'
import { LegendModal } from './LegendModal'
import { FeedbackButton } from './FeedbackButton'
import { useTelemetry } from '@/app/providers'

import { ViewToggle } from './ViewToggle'
import { LegendButton } from './LegendButton'

const DENSITY_COOKIE_KEY = 'schedule-density'
const VIEW_MODE_COOKIE_KEY = 'schedule-view-mode'
const VIEW_USAGE_STORAGE_KEY = 'schedule-view-usage'
const PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function isDensity(value: string): value is Density {
  return value === 'extra-compact' || value === 'compact' || value === 'comfortable'
}

function isViewMode(value: string): value is ViewMode {
  return value === 'people' || value === 'shifts'
}

function getCookieValue(key: string): string | null {
  if (typeof document === 'undefined') return null

  const encodedKey = encodeURIComponent(key)
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${encodedKey}=`))

  if (!cookie) return null
  return decodeURIComponent(cookie.split('=').slice(1).join('='))
}

function setCookieValue(key: string, value: string) {
  if (typeof document === 'undefined') return

  document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; max-age=${PREFERENCE_COOKIE_MAX_AGE}; samesite=lax`
}

function getDensityFromCookie(): Density | null {
  const value = getCookieValue(DENSITY_COOKIE_KEY)
  return value && isDensity(value) ? value : null
}

function getViewModeFromCookie(): ViewMode | null {
  const value = getCookieValue(VIEW_MODE_COOKIE_KEY)
  return value && isViewMode(value) ? value : null
}

function incrementViewUsage(viewMode: ViewMode): number | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(VIEW_USAGE_STORAGE_KEY)
    const usage = raw ? (JSON.parse(raw) as Partial<Record<ViewMode, number>>) : {}
    const nextCount = (usage[viewMode] || 0) + 1
    const nextUsage = {
      people: viewMode === 'people' ? nextCount : usage.people || 0,
      shifts: viewMode === 'shifts' ? nextCount : usage.shifts || 0,
    }

    window.localStorage.setItem(VIEW_USAGE_STORAGE_KEY, JSON.stringify(nextUsage))
    return nextCount
  } catch {
    return null
  }
}

interface ScheduleAppProps {
  basePath?: string
}

export function ScheduleApp({ basePath = '/' }: ScheduleAppProps) {
  const searchParams = useSearchParams()
  const ymParam = searchParams.get('ym')

  const currentYM = ymParam && isValidYM(ymParam) ? ymParam : getCurrentYM()

  const [density, setDensity] = useState<Density>('compact')
  const [viewMode, setViewMode] = useState<ViewMode>('people')
  const [isLegendOpen, setIsLegendOpen] = useState(false)

  const { isLoading: isConfigLoading, error: configError } = useRuntimeConfig()

  const { data, isLoading, error, refetch } = useMonthShifts(currentYM)
  const { track } = useTelemetry()

  useEffect(() => {
    const cookieDensity = getDensityFromCookie()
    if (cookieDensity) {
      setDensity(cookieDensity)
      track({ feature: 'density_toggle', action: 'hydrate_density_preference', value: cookieDensity })
    }

    const cookieViewMode = getViewModeFromCookie()
    if (cookieViewMode) {
      setViewMode(cookieViewMode)
      track({ feature: 'view_toggle', action: 'hydrate_view_mode_preference', value: cookieViewMode })
    }
  }, [track])

  // Track page view on mount
  useEffect(() => {
    track({ feature: 'schedule_app', action: 'page_view', value: currentYM })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on initial page load

  const handleLegendOpen = useCallback(() => {
    if (isLegendOpen) return
    setIsLegendOpen(true)
    track({ feature: 'schedule_app', action: 'open_legend', value: currentYM })
  }, [currentYM, isLegendOpen, track])

  const handleRetry = useCallback(() => {
    track({ feature: 'schedule_app', action: 'retry_fetch', value: currentYM })
    refetch()
  }, [currentYM, refetch, track])

  const densityChangeHandler = useCallback((newDensity: Density) => {
    setDensity(newDensity)
    setCookieValue(DENSITY_COOKIE_KEY, newDensity)
    track({ feature: 'density_toggle', action: 'persist_density_preference', value: newDensity })
  }, [track])

  const viewModeChangeHandler = useCallback((newMode: ViewMode) => {
    setViewMode(newMode)
    setCookieValue(VIEW_MODE_COOKIE_KEY, newMode)
    track({ feature: 'view_toggle', action: 'persist_view_mode_preference', value: newMode })

    const usageCount = incrementViewUsage(newMode)
    if (usageCount !== null) {
      track({ feature: 'view_toggle', action: 'long_term_usage_count', value: `${newMode}:${usageCount}` })
    }
  }, [track])

  if (isConfigLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-full space-y-2">
        {configError && (
          <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-md p-4">
            <p className="text-sm font-semibold">Configurazione parziale</p>
            <p className="text-sm mt-1">
              {configError} La UI legge la configurazione runtime dal Worker/R2; verifica che i file in <code>src/config</code> siano stati sincronizzati correttamente.
            </p>
          </div>
        )}

        <div className="flex flex-col bg-card border-b border-border px-4 py-2 gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-shrink-0">
              <MonthNav currentYM={currentYM} basePath={basePath} />
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <ViewToggle
                viewMode={viewMode}
                onToggle={viewModeChangeHandler}
                variant="responsive"
              />
              <DensityToggle
                density={density}
                onDensityChange={densityChangeHandler}
                variant="responsive"
              />
              <LegendButton onClick={handleLegendOpen} variant="full" />
              <FeedbackButton />
            </div>

            <div className="sm:hidden">
              <FeedbackButton />
            </div>
          </div>

          <div className="flex sm:hidden items-center justify-between gap-2">
            <ViewToggle
              viewMode={viewMode}
              onToggle={viewModeChangeHandler}
              variant="compact"
            />
            <div className="flex items-center gap-2">
              <DensityToggle
                density={density}
                onDensityChange={densityChangeHandler}
                variant="compact"
              />
              <LegendButton onClick={handleLegendOpen} variant="icon" />
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="space-y-4 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="text-muted-foreground">Caricamento turni...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="text-destructive font-semibold text-lg">Errore nel caricamento dei dati</div>
              <p className="text-muted-foreground max-w-md">
                {error.message || 'Si è verificato un errore imprevisto'}
              </p>
              <button
                onClick={handleRetry}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Riprova
              </button>
            </div>
          </div>
        )}

        {data && !error && (
          <>
            {data.people.length > 0 ? (
              <ScheduleGrid
                data={data}
                density={density}
                codes={data.codes || []}
                viewMode={viewMode}
              />
            ) : (
              <div className="bg-card border border-border rounded-lg p-12">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg">Nessun turno trovato per questo mese</p>
                </div>
              </div>
            )}

            <LegendModal
              codes={data.codes || []}
              shiftNames={data.shiftNames}
              isOpen={isLegendOpen}
              onClose={() => setIsLegendOpen(false)}
            />
          </>
        )}
      </div>
    </div>
  )
}

export function ScheduleAppWithSuspense({ basePath = '/' }: ScheduleAppProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      }
    >
      <RuntimeConfigProvider>
        <ScheduleApp basePath={basePath} />
      </RuntimeConfigProvider>
    </Suspense>
  )
}
