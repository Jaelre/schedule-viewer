'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getCurrentYM, isValidYM } from '@/lib/date'
import { useMonthShifts } from '@/lib/api-client'
import { shiftCodeMap } from '@/lib/shift-code-map'
import { RuntimeConfigProvider, useRuntimeConfig } from '@/lib/config/runtime-config'
import { MonthNav } from './MonthNav'
import { DensityToggle, type Density } from './DensityToggle'
import { ScheduleGrid } from './ScheduleGrid'
import type { ViewMode } from './ScheduleGrid/types'
import { LegendModal } from './LegendModal'
import { FeedbackButton } from './FeedbackButton'
import { useTelemetry } from '@/app/providers'

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

  // Track page view on mount
  useEffect(() => {
    track({ feature: 'schedule_app', action: 'page_view', value: currentYM })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on initial page load

  const handleToggleView = useCallback(() => {
    setViewMode((previous) => {
      const nextMode: ViewMode = previous === 'people' ? 'shifts' : 'people'
      track({ feature: 'schedule_app', action: 'toggle_view', value: nextMode })
      return nextMode
    })
  }, [track])

  const handleLegendOpen = useCallback(() => {
    if (isLegendOpen) return
    setIsLegendOpen(true)
    track({ feature: 'schedule_app', action: 'open_legend', value: currentYM })
  }, [currentYM, isLegendOpen, track])

  const handleRetry = useCallback(() => {
    track({ feature: 'schedule_app', action: 'retry_fetch', value: currentYM })
    refetch()
  }, [currentYM, refetch, track])

  const densityChangeHandler = useCallback(
    (newDensity: Density) => {
      setDensity(newDensity)
    },
    []
  )

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
              {configError} È possibile aggiornare i file JSON in <code>/public/config</code> senza dover ricostruire il sito.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-2 bg-card border-b border-border">
          <div className="flex-1 flex justify-start">
            <MonthNav currentYM={currentYM} basePath={basePath} />
          </div>
          <div className="flex justify-center">
            <FeedbackButton />
          </div>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 justify-end">
            <DensityToggle
              onDensityChange={densityChangeHandler}
              onLegendClick={handleLegendOpen}
            />
            <button
              type="button"
              onClick={handleToggleView}
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
              aria-pressed={viewMode === 'shifts'}
            >
              {viewMode === 'people' ? 'Vista turni' : 'Vista medici'}
            </button>
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
                codeMap={shiftCodeMap}
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
              codeMap={shiftCodeMap}
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
