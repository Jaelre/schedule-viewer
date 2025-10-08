'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getCurrentYM, isValidYM } from '@/lib/date'
import { useMonthShifts } from '@/lib/api-client'
import { shiftCodeMap } from '@/lib/shift-code-map'
import { MonthNav } from './_components/MonthNav'
import { DensityToggle, type Density } from './_components/DensityToggle'
import { ScheduleGrid } from './_components/ScheduleGrid'
import { LegendModal } from './_components/LegendModal'

function PageContent() {
  const searchParams = useSearchParams()
  const ymParam = searchParams.get('ym')

  // Default to current month if no ym param or invalid
  const currentYM = ymParam && isValidYM(ymParam) ? ymParam : getCurrentYM()

  const [density, setDensity] = useState<Density>('comfortable')
  const [isLegendOpen, setIsLegendOpen] = useState(false)

  const { data, isLoading, error, refetch } = useMonthShifts(currentYM)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-full space-y-2">
        {/* Compact Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2 bg-card border-b border-border">
          <MonthNav currentYM={currentYM} />
          <DensityToggle
            onDensityChange={setDensity}
            onLegendClick={() => setIsLegendOpen(true)}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="space-y-4 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="text-muted-foreground">Caricamento turni...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="text-destructive font-semibold text-lg">
                Errore nel caricamento dei dati
              </div>
              <p className="text-muted-foreground max-w-md">
                {error.message || 'Si è verificato un errore imprevisto'}
              </p>
              <button
                onClick={() => refetch()}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Riprova
              </button>
            </div>
          </div>
        )}

        {/* Success State */}
        {data && !error && (
          <>
            {/* Grid */}
            {data.people.length > 0 ? (
              <ScheduleGrid data={data} density={density} codes={data.codes || []} codeMap={shiftCodeMap} />
            ) : (
              <div className="bg-card border border-border rounded-lg p-12">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg">Nessun turno trovato per questo mese</p>
                </div>
              </div>
            )}

            {/* Legend Modal */}
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

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      }
    >
      <PageContent />
    </Suspense>
  )
}
