'use client'

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

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handlePrevious}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        aria-label="Mese precedente"
      >
        ← Precedente
      </button>

      <div className="text-xl font-semibold min-w-[200px] text-center">
        {formatMonthDisplay(currentYM)}
      </div>

      <button
        onClick={handleNext}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        aria-label="Mese successivo"
      >
        Successivo →
      </button>
    </div>
  )
}
