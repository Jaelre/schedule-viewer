import type { MonthShifts } from '@/lib/types'
import { getDaysInMonth } from '@/lib/date'
import { getDoctorDisplayName } from '@/lib/doctor-names'

const PAGE_WIDTH = 841.89
const PAGE_HEIGHT = 595.28
const TOP_MARGIN = 40
const BOTTOM_MARGIN = 40
const LEFT_MARGIN = 40
const RIGHT_MARGIN = 40
const LINE_HEIGHT = 12
const DEFAULT_FONT_SIZE = 7

type PageLine = {
  text: string
  fontSize?: number
}
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

function buildPageStream(lines: PageLine[]): string {
  const availableHeight = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN
  const maxLines = Math.max(1, Math.floor(availableHeight / LINE_HEIGHT))
  const pageLines = lines.slice(0, maxLines)

  const startY = PAGE_HEIGHT - TOP_MARGIN
  const commands = [
    'BT',
    `/F1 ${DEFAULT_FONT_SIZE} Tf`,
    `${LINE_HEIGHT} TL`,
    `${LEFT_MARGIN} ${startY} Td`,
  ]

  let currentFontSize = DEFAULT_FONT_SIZE

  pageLines.forEach((line, lineIndex) => {
    if (lineIndex !== 0) {
      commands.push('T*')
    }

    const fontSize = line.fontSize ?? DEFAULT_FONT_SIZE
    if (fontSize !== currentFontSize) {
      commands.push(`/F1 ${fontSize} Tf`)
      currentFontSize = fontSize
    }

    const printable = line.text.trim().length > 0 ? line.text : ' '
    commands.push(`(${escapePdfText(printable)}) Tj`)
  })

  commands.push('ET')

  return commands.join('\n')
}

function buildPdfDocument(pages: PageLine[][]): string {
  const objects: { body: string }[] = []

  const addObject = (body: string): number => {
    objects.push({ body })
    return objects.length
  }

  const fontObject = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>')
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

function padCell(value: string, width: number): string {
  if (value.length >= width) {
    return value
  }

  return `${value}${' '.repeat(width - value.length)}`
}

function buildTableLines(header: string[], rows: string[][]): string[] {
  const columnWidths = header.map((_, columnIndex) => {
    const headerWidth = header[columnIndex]?.length ?? 0
    const rowWidth = rows.reduce((max, row) => {
      const cell = row[columnIndex] ?? ''
      return Math.max(max, cell.length)
    }, 0)

    return Math.max(headerWidth, rowWidth)
  })

  const separator = `+-${columnWidths.map(width => '-'.repeat(width)).join('-+-')}-+`
  const formatRow = (row: string[]) =>
    `| ${row
      .map((cell, index) => padCell(cell ?? '', columnWidths[index] ?? 0))
      .join(' | ')} |`

  const lines: string[] = []
  lines.push(separator)
  lines.push(formatRow(header))
  lines.push(separator)
  rows.forEach(row => {
    lines.push(formatRow(row))
  })
  lines.push(separator)

  return lines
}

function formatShiftGrid(month: MonthShifts): string[] {
  const daysInMonth = getDaysInMonth(month.ym)
  const title = `Turni ${formatMonthLabel(month.ym)}`
  const timestamp = new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date())

  const header = ['Medico']
  for (let day = 1; day <= daysInMonth; day += 1) {
    header.push(`${day}`)
  }

  const rows: string[][] = month.people.map((person, personIndex) => {
    const personRow: string[] = [person.name]

    for (let day = 0; day < daysInMonth; day += 1) {
      const codes = month.rows[personIndex]?.[day] ?? []
      if (codes && codes.length > 0) {
        const label = codes
          .map(code => {
            const friendly = month.shiftNames?.[code]
            return friendly ? `${code} (${friendly})` : code
          })
          .join(', ')
        personRow.push(label)
      } else {
        personRow.push('-')
      }
    }

    return personRow
  })

  const gridLines = buildTableLines(header, rows)
  const lines: string[] = [title, `Esportato il ${timestamp}`, '', ...gridLines]

  if (month.codes && month.codes.length > 0) {
    lines.push('')
    lines.push('Legenda codici:')
    month.codes.forEach(code => {
      const friendly = month.shiftNames?.[code]
      lines.push(`  ${code}${friendly ? ` – ${friendly}` : ''}`)
    })
  }

  if (pages.length === 0) {
    pages.push([...firstPageHeader])
  }

  if (legendLines.length > 0) {
    let remainingLegend = [...legendLines]
    let currentPageIndex = pages.length - 1

    while (remainingLegend.length > 0) {
      const currentPage = pages[currentPageIndex]
      const remainingCapacity = maxLinesPerPage - currentPage.length

      if (remainingCapacity > 0) {
        const toAdd = remainingLegend.slice(0, remainingCapacity)
        currentPage.push(...toAdd)
        remainingLegend = remainingLegend.slice(toAdd.length)
      } else {
        const capacity = Math.max(0, maxLinesPerPage - continuationHeader.length)
        const newPage = [...continuationHeader]
        const toAdd = capacity > 0 ? remainingLegend.slice(0, capacity) : []
        newPage.push(...toAdd)
        pages.push(newPage)
        remainingLegend = remainingLegend.slice(toAdd.length)
        currentPageIndex = pages.length - 1
        if (capacity === 0 && remainingLegend.length > 0) {
          // Prevent infinite loop by discarding extra legend lines if there's no space
          break
        }
      }
    }
  }

  return pages
}

/**
 * Esporta i turni in un PDF costruito dinamicamente senza dipendenze esterne.
 */
export async function exportShiftsToPdf(month: MonthShifts): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('L\'esportazione PDF è disponibile solo nel browser')
  }

  const allLines = formatShiftGrid(month)
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
