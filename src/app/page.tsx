'use client'

import { Suspense, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { getCurrentYM, isValidYM } from '@/lib/date'
import { useMonthShifts } from '@/lib/api-client'
import { shiftCodeMap } from '@/lib/shift-code-map'
import { MonthNav } from './_components/MonthNav'
import { DensityToggle, type Density } from './_components/DensityToggle'
import { ScheduleGrid } from './_components/ScheduleGrid'
import { LegendModal } from './_components/LegendModal'

const ACCESS_COOKIE = 'schedule_viewer_access'
const ACCESS_PASSWORD_HASH = '608ea934b1703c8eece4951a48c86bcf6e7f262636eaf62b550ffaa5bf8b6260'

async function hashPassword(candidate: string): Promise<string | null> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return null
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(candidate)
  const digest = await window.crypto.subtle.digest('SHA-256', data)

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function hasAccessCookie() {
  if (typeof document === 'undefined') {
    return false
  }

  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie.startsWith(`${ACCESS_COOKIE}=`))
}

function persistAccessCookie() {
  if (typeof document === 'undefined') {
    return
  }

  const expires = new Date()
  // Set cookie for ten years to provide a "long lasting" bypass
  expires.setFullYear(expires.getFullYear() + 10)

  document.cookie = `${ACCESS_COOKIE}=true; expires=${expires.toUTCString()}; path=/`
}

function PasswordGate({ children }: { children: ReactNode }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [hasAccess, setHasAccess] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setHasAccess(hasAccessCookie())
    setIsChecking(false)
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedPassword = password.trim()
    if (!trimmedPassword) {
      setError('Inserisci la password.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const hashedInput = await hashPassword(trimmedPassword)

      if (!hashedInput) {
        setError('Impossibile verificare la password in questo browser.')
        return
      }

      if (hashedInput === ACCESS_PASSWORD_HASH) {
        persistAccessCookie()
        setHasAccess(true)
        setError('')
        return
      }

      setError('Password non valida. Riprova.')
    } catch (hashError) {
      console.error('Password hashing failed', hashError)
      setError('Si è verificato un errore nella verifica della password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isChecking) {
    return null
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Accesso richiesto</h1>
            <p className="text-sm text-muted-foreground">
              Inserisci la password per visualizzare il calendario.
            </p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Inserisci password"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Verifica…' : 'Conferma'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function PageContent() {
  const searchParams = useSearchParams()
  const ymParam = searchParams.get('ym')

  // Default to current month if no ym param or invalid
  const currentYM = ymParam && isValidYM(ymParam) ? ymParam : getCurrentYM()

  const [density, setDensity] = useState<Density>('compact')
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
    <PasswordGate>
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
        }
      >
        <PageContent />
      </Suspense>
    </PasswordGate>
  )
}
