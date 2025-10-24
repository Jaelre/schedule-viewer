import type { MonthShifts } from '@/lib/types'
import { getDaysInMonth } from '@/lib/date'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const TOP_MARGIN = 50
const BOTTOM_MARGIN = 50
const LEFT_MARGIN = 40
const LINE_HEIGHT = 18
const utf8Encoder = new TextEncoder()

function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split('-').map(Number)
  const date = new Date(year, month - 1, 1)

  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: 'long',
  }).format(date)
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildPageStream(lines: string[]): string {
  const availableHeight = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN
  const maxLines = Math.max(1, Math.floor(availableHeight / LINE_HEIGHT))
  const pageLines = lines.slice(0, maxLines)

  const startY = PAGE_HEIGHT - TOP_MARGIN
  const commands = [
    'BT',
    '/F1 12 Tf',
    `${LINE_HEIGHT} TL`,
    `${LEFT_MARGIN} ${startY} Td`,
  ]

  pageLines.forEach((line, lineIndex) => {
    if (lineIndex !== 0) {
      commands.push('T*')
    }

    const printable = line.trim().length > 0 ? line : ' '
    commands.push(`(${escapePdfText(printable)}) Tj`)
  })

  commands.push('ET')

  return commands.join('\n')
}

function buildPdfDocument(pages: string[][]): string {
  const objects: { body: string }[] = []

  const addObject = (body: string): number => {
    objects.push({ body })
    return objects.length
  }

  const fontObject = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  const pageObjectIndexes: number[] = []

  pages.forEach(pageLines => {
    const stream = buildPageStream(pageLines)
    const streamObject = addObject(
      `<< /Length ${utf8Encoder.encode(stream).length} >>\nstream\n${stream}\nendstream`,
    )

    const pageObject = addObject(
      [
        '<<',
        '  /Type /Page',
        '  /Parent __PARENT__',
        `  /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}]`,
        `  /Resources << /Font << /F1 ${fontObject} 0 R >> >>`,
        `  /Contents ${streamObject} 0 R`,
        '>>',
      ].join('\n'),
    )

    pageObjectIndexes.push(pageObject)
  })

  const pagesObject = addObject(
    [
      '<<',
      '  /Type /Pages',
      `  /Kids [${pageObjectIndexes.map(index => `${index} 0 R`).join(' ')}]`,
      `  /Count ${pageObjectIndexes.length}`,
      '>>',
    ].join('\n'),
  )

  pageObjectIndexes.forEach(index => {
    const body = objects[index - 1].body
    objects[index - 1].body = body.replace('__PARENT__', `${pagesObject} 0 R`)
  })

  const catalogObject = addObject(`<< /Type /Catalog /Pages ${pagesObject} 0 R >>`)

  let output = '%PDF-1.4\n%âãÏÓ\n'
  const offsets: number[] = [0]
  let currentOffset = utf8Encoder.encode(output).length

  objects.forEach((object, index) => {
    offsets.push(currentOffset)
    const objectString = `${index + 1} 0 obj\n${object.body}\nendobj\n`
    output += objectString
    currentOffset += utf8Encoder.encode(objectString).length
  })

  const xrefOffset = currentOffset
  output += `xref\n0 ${objects.length + 1}\n`
  output += '0000000000 65535 f \n'

  for (let index = 1; index < offsets.length; index += 1) {
    output += `${offsets[index].toString().padStart(10, '0')} 00000 n \n`
  }

  output += 'trailer\n'
  output += `<< /Size ${objects.length + 1} /Root ${catalogObject} 0 R >>\n`
  output += `startxref\n${xrefOffset}\n%%EOF`

  return output
}

function formatShiftSummary(month: MonthShifts): string[] {
  const daysInMonth = getDaysInMonth(month.ym)
  const lines: string[] = []
  const title = `Turni ${formatMonthLabel(month.ym)}`
  const timestamp = new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date())

  lines.push(title)
  lines.push(`Esportato il ${timestamp}`)
  lines.push('')

  for (let day = 1; day <= daysInMonth; day += 1) {
    lines.push(`Giorno ${day}`)

    let assignments = 0

    month.people.forEach((person, personIndex) => {
      const codes = month.rows[personIndex]?.[day - 1] ?? []
      if (codes && codes.length > 0) {
        assignments += 1
        const label = codes
          .map(code => {
            const friendly = month.shiftNames?.[code]
            return friendly ? `${code} – ${friendly}` : code
          })
          .join(', ')
        lines.push(`  ${person.name}: ${label}`)
      }
    })

    if (assignments === 0) {
      lines.push('  Nessun turno assegnato')
    }

    lines.push('')
  }

  return lines
}

/**
 * Esporta i turni in un PDF costruito dinamicamente senza dipendenze esterne.
 */
export async function exportShiftsToPdf(month: MonthShifts): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('L\'esportazione PDF è disponibile solo nel browser')
  }

  const allLines = formatShiftSummary(month)
  const availableHeight = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN
  const maxLinesPerPage = Math.max(1, Math.floor(availableHeight / LINE_HEIGHT))
  const pages: string[][] = []

  for (let index = 0; index < allLines.length; index += maxLinesPerPage) {
    pages.push(allLines.slice(index, index + maxLinesPerPage))
  }
  const pdfContent = buildPdfDocument(pages)

  const blob = new Blob([pdfContent], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `turni-${month.ym}.pdf`
  anchor.click()
  URL.revokeObjectURL(url)
}
