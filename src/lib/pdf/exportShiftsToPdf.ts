import type { MonthShifts } from '@/lib/types'

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

      const cleanup = () => {
        if (resolved) {
          return
        }

        resolved = true
        window.removeEventListener('afterprint', handleAfterPrint)

        if (mediaQueryList) {
          if ('removeEventListener' in mediaQueryList) {
            mediaQueryList.removeEventListener('change', handleMediaChange as EventListener)
          } else if ('removeListener' in mediaQueryList) {
            mediaQueryList.removeListener(handleMediaChange)
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

      if (mediaQueryList) {
        if ('addEventListener' in mediaQueryList) {
          mediaQueryList.addEventListener('change', handleMediaChange as EventListener)
        } else if ('addListener' in mediaQueryList) {
          mediaQueryList.addListener(handleMediaChange)
        }
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
