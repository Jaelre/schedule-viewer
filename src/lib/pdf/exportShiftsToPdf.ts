import type { MonthShifts } from '@/lib/types'
import { getDaysInMonth } from '@/lib/date'
import { getDoctorDisplayName } from '@/lib/doctor-names'
import { getShiftDisplayCode } from '@/lib/shift-format'

/**
 * Prepara la pagina per la stampa e avvia il dialog di stampa del browser.
 * Il PDF risultante corrisponde al layout renderizzato nel DOM.
 */
export async function exportShiftsToPdf(
  month: MonthShifts,
  printableRoot: HTMLElement | null,
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error("L'esportazione PDF è disponibile solo nel browser")
  }

  if (!printableRoot || !document.body.contains(printableRoot)) {
    throw new Error('Impossibile trovare il contenuto da esportare.')
  }

  const previousTitle = document.title
  const downloadTitle = `turni-${month.ym}`

  const waitForPrint = () =>
    new Promise<void>(resolve => {
      let resolved = false
      const mediaQueryList =
        typeof window.matchMedia === 'function' ? window.matchMedia('print') : null
      let fallbackId: number | null = null

      type MediaQueryListWithLegacy = MediaQueryList & {
        addListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void
        removeListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void
      }

      const cleanup = () => {
        if (resolved) {
          return
        }

        resolved = true
        window.removeEventListener('afterprint', handleAfterPrint)

        if (mediaQueryList) {
          if ('removeEventListener' in mediaQueryList) {
            mediaQueryList.removeEventListener('change', handleMediaChange as EventListener)
          } else {
            const legacyMediaQueryList = mediaQueryList as MediaQueryListWithLegacy
            legacyMediaQueryList.removeListener?.(handleMediaChange)
          }
        }

        if (fallbackId !== null) {
          window.clearTimeout(fallbackId)
        }

        resolve()
      }

      const handleAfterPrint = () => {
        cleanup()
      }

      const handleMediaChange = (event: MediaQueryListEvent) => {
        if (!event.matches) {
          cleanup()
        }
      }

      window.addEventListener('afterprint', handleAfterPrint)

    for (let day = 0; day < daysInMonth; day += 1) {
      const codes = month.rows[personIndex]?.[day] ?? []
      if (codes && codes.length > 0) {
        const compactCodes = codes
          .map(code => getShiftDisplayCode(code))
          .filter(value => value.length > 0)

        personRow.push(compactCodes.length > 0 ? compactCodes.join(', ') : '-')
      } else {
        personRow.push('-')
      }

      document.title = downloadTitle
      printableRoot.scrollIntoView({ block: 'start' })

      requestAnimationFrame(() => {
        window.focus()
        window.print()

        fallbackId = window.setTimeout(() => {
          cleanup()
        }, 60000)
      })
    })

  try {
    await waitForPrint()
  } finally {
    document.title = previousTitle
  }
}
