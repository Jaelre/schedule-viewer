'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MonthNav } from '@/app/_components/MonthNav'
import { LegendModal } from '@/app/_components/LegendModal'
import { getCurrentYM, isValidYM, formatMonthDisplay } from '@/lib/date'
import { useMonthShifts } from '@/lib/api-client'
import { shiftCodeMap } from '@/lib/shift-code-map'
import { exportShiftsToPdf } from '@/lib/pdf/exportShiftsToPdf'
import { PrintableSchedule } from './PrintableSchedule'

export function PdfExportApp() {
  const searchParams = useSearchParams()
  const ymParam = searchParams.get('ym')

  const currentYM = ymParam && isValidYM(ymParam) ? ymParam : getCurrentYM()

  const { data, isLoading, error, refetch } = useMonthShifts(currentYM)
  const [isLegendOpen, setIsLegendOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const printableRef = useRef<HTMLDivElement>(null)

  const monthLabel = useMemo(() => formatMonthDisplay(currentYM), [currentYM])

  const handleExport = useCallback(async () => {
    if (!data) {
      return
    }

    setExportError(null)
    setIsExporting(true)
    try {
      await exportShiftsToPdf(data, printableRef.current)
    } catch (err) {
      console.error('Failed to export PDF', err)
      setExportError(
        err instanceof Error
          ? err.message
          : 'Impossibile generare il PDF, riprova più tardi.',
      )
    } finally {
      setIsExporting(false)
    }
  }, [data])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <MonthNav currentYM={currentYM} basePath="/pdf" />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsLegendOpen(true)}
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
              disabled={!data}
            >
              Legenda turni
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4 print:hidden">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Esporta turni in PDF</h1>
            <p className="text-sm text-muted-foreground">
              Scarica una versione stampabile dei turni di {monthLabel}. Il documento include tutti i medici e le assegnazioni giornaliere con le descrizioni estese dei codici turno.
            </p>
          </div>

          

          {exportError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {exportError}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={!data || isLoading || isExporting || !!error}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExporting ? 'Preparazione stampa…' : 'Stampa o salva in PDF'}
            </button>
            <p className="text-xs text-muted-foreground">
              Il PDF utilizza il layout mostrato in anteprima qui sotto.
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="space-y-2 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="text-sm text-muted-foreground">Caricamento turni…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center">
            <p className="text-lg font-semibold text-destructive">Errore nel caricamento dei dati</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {error.message || 'Si è verificato un problema imprevisto durante il recupero dei turni.'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Riprova
            </button>
          </div>
        )}

        {data && data.people.length === 0 && !isLoading && !error && (
          <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Nessun turno disponibile per questo mese.
          </div>
        )}

        {data && (
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm print:border-0 print:bg-transparent print:p-0">
            <PrintableSchedule ref={printableRef} month={data} />
          </div>
        )}

        {data && (
          <LegendModal
            codes={data.codes || []}
            shiftNames={data.shiftNames}
            codeMap={shiftCodeMap}
            isOpen={isLegendOpen}
            onClose={() => setIsLegendOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
