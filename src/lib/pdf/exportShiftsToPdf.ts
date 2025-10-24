import type { MonthShifts } from '@/lib/types'
import { getDaysInMonth } from '@/lib/date'

function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split('-').map(Number)
  const date = new Date(year, month - 1, 1)

  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: 'long',
  }).format(date)
}

function formatDayCells(codes: string[] | null, shiftNames?: Record<string, string>): string {
  if (!codes || codes.length === 0) {
    return ''
  }

  return codes
    .map(code => {
      const friendly = shiftNames?.[code]
      return friendly ? `${code} – ${friendly}` : code
    })
    .join('\n')
}

/**
 * Export the provided month shifts to a PDF document and trigger a download.
 * The heavy PDF libraries are dynamically imported so the bundle stays lean.
 */
export async function exportShiftsToPdf(month: MonthShifts): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('L\'esportazione PDF è disponibile solo nel browser')
  }

  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const autoTable = autoTableModule.default ?? autoTableModule
  if (!autoTable) {
    throw new Error('Impossibile caricare il motore di esportazione PDF')
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const title = `Turni ${formatMonthLabel(month.ym)}`
  const timestamp = new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date())

  doc.setFontSize(18)
  doc.text(title, 40, 40)
  doc.setFontSize(11)
  doc.text(`Esportato il ${timestamp}`, 40, 58)

  const daysInMonth = getDaysInMonth(month.ym)
  const headers = [['Medico', ...Array.from({ length: daysInMonth }, (_, index) => String(index + 1))]]

  const body = month.people.map((person, personIndex) => {
    const row = month.rows[personIndex] || []

    return [
      person.name,
      ...Array.from({ length: daysInMonth }, (_, dayIndex) =>
        formatDayCells(row[dayIndex] ?? null, month.shiftNames),
      ),
    ]
  })

  autoTable(doc, {
    head: headers,
    body,
    startY: 80,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 150 },
    },
    margin: { left: 40, right: 40 },
  })

  doc.save(`turni-${month.ym}.pdf`)
}
