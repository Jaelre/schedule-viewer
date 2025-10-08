'use client'

import { ChangeEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getPreviousYM, getNextYM, formatMonthDisplay } from '@/lib/date'

interface MonthNavProps {
  currentYM: string
}

export function MonthNav({ currentYM }: MonthNavProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigateToMonth = (ym: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('ym', ym)
    router.push(`/?${params.toString()}`)
  }

  const handlePrevious = () => {
    navigateToMonth(getPreviousYM(currentYM))
  }

  const handleNext = () => {
    navigateToMonth(getNextYM(currentYM))
  }

  const handleMonthChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (value) {
      navigateToMonth(value)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handlePrevious}
        className="px-2 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors shrink-0"
        aria-label="Mese precedente"
      >
        ←
      </button>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="text-base font-semibold whitespace-nowrap">
          {formatMonthDisplay(currentYM)}
        </div>
        <label className="sr-only" htmlFor="month-picker">
          Seleziona mese
        </label>
        <input
          id="month-picker"
          type="month"
          value={currentYM}
          onChange={handleMonthChange}
          className="rounded border border-input bg-background px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0"
        />
      </div>

      <button
        onClick={handleNext}
        className="px-2 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors shrink-0"
        aria-label="Mese successivo"
      >
        →
      </button>
    </div>
  )
}
