import type { MonthShifts } from '@/lib/types'
import { getDaysInMonth } from '@/lib/date'
import { getDoctorDisplayName } from '@/lib/doctor-names'
import { getShiftDisplayCode } from '@/lib/shift-format'

const PAGE_WIDTH = 841.89
const PAGE_HEIGHT = 595.28
const TOP_MARGIN = 40
const BOTTOM_MARGIN = 40
const LEFT_MARGIN = 40
const RIGHT_MARGIN = 40
const LINE_HEIGHT = 12
const DEFAULT_FONT_SIZE = 7
const MAX_NAME_COLUMN_WIDTH = 26
const MAX_DAY_COLUMN_WIDTH = 10

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

function truncateCell(value: string, width: number): string {
  if (value.length <= width) {
    return value
  }

  if (width <= 1) {
    return value.slice(0, width)
  }

  return `${value.slice(0, width - 1)}…`
}

function formatCell(value: string, width: number): string {
  if (width <= 0) {
    return ''
  }

  const truncated = truncateCell(value, width)
  if (truncated.length >= width) {
    return truncated
  }

  return `${truncated}${' '.repeat(width - truncated.length)}`
}

function getColumnWidthLimit(columnIndex: number): number {
  return columnIndex === 0 ? MAX_NAME_COLUMN_WIDTH : MAX_DAY_COLUMN_WIDTH
}

function calculateColumnWidths(header: string[], rows: string[][]): number[] {
  return header.map((_, columnIndex) => {
    const limit = getColumnWidthLimit(columnIndex)

    const headerWidth = Math.min(header[columnIndex]?.length ?? 0, limit)
    const rowWidth = rows.reduce((max, row) => {
      const cell = row[columnIndex] ?? ''
      const measured = Math.min(cell.length, limit)
      return Math.max(max, measured)
    }, 0)

    const resolved = Math.max(headerWidth, rowWidth)
    if (columnIndex === 0) {
      return Math.max(resolved, Math.min(limit, 8))
    }

    return Math.max(resolved, Math.min(limit, 3))
  })
}

function buildTableLines(
  header: string[],
  rows: string[][],
  columnWidths: number[],
): string[] {
  const formatRow = (row: string[]) =>
    `| ${row
      .map((cell, index) => formatCell(cell ?? '', columnWidths[index] ?? 0))
      .join(' | ')} |`

  const separator = `+-${columnWidths.map(width => '-'.repeat(width)).join('-+-')}-+`

  const lines: string[] = []
  lines.push(separator)
  lines.push(formatRow(header))
  lines.push(separator)

  rows.forEach(row => {
    lines.push(formatRow(row))
    lines.push(separator)
  })

  return lines
}

function formatShiftGrid(month: MonthShifts): PageLine[][] {
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
    const displayName = getDoctorDisplayName(person.id, person.name).display
    const personRow: string[] = [displayName]

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
    }

    return personRow
  })

  const columnWidths = calculateColumnWidths(header, rows)

  const headerTemplate: PageLine[] = [
    { text: title, fontSize: 10 },
    { text: `Esportato il ${timestamp}` },
    { text: '' },
  ]
  const availableHeight = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN
  const baseMaxLines = Math.max(1, Math.floor(availableHeight / LINE_HEIGHT))
  let maxLinesPerPage = Math.max(baseMaxLines, headerTemplate.length + 1)

  const legendLines: PageLine[] = []
  if (month.codes && month.codes.length > 0) {
    legendLines.push({ text: '' })
    legendLines.push({ text: 'Legenda codici:' })
    month.codes.forEach(code => {
      const friendly = month.shiftNames?.[code]
      legendLines.push({ text: `  ${code}${friendly ? ` – ${friendly}` : ''}` })
    })
  }

  const cloneHeader = (): PageLine[] => headerTemplate.map(line => ({ ...line }))
  const pages: PageLine[][] = []

  const headerLineCount = buildTableLines(header, [], columnWidths).length
  const rowLineCost = 2

  const minLinesForContent = headerTemplate.length + headerLineCount + rowLineCost
  if (maxLinesPerPage < minLinesForContent) {
    maxLinesPerPage = minLinesForContent
  }

  const buildTableForRows = (rowsSlice: string[][]): PageLine[] =>
    buildTableLines(header, rowsSlice, columnWidths).map(text => ({ text }))

  const pushPage = (rowsSlice: string[][], legendStartIndex: number): number => {
    const page = cloneHeader()
    let usedLines = headerTemplate.length

    if (rowsSlice.length > 0) {
      const tableLines = buildTableForRows(rowsSlice)
      tableLines.forEach(line => page.push(line))
      usedLines += tableLines.length
    } else {
      page.push({ text: '' })
      usedLines += 1
    }

    let nextLegendIndex = legendStartIndex
    while (nextLegendIndex < legendLines.length && usedLines < maxLinesPerPage) {
      page.push({ ...legendLines[nextLegendIndex] })
      usedLines += 1
      nextLegendIndex += 1
    }

    pages.push(page)
    return nextLegendIndex
  }

  const pagesWithoutLegend: string[][][] = []
  let currentRows: string[][] = []
  let currentLineCount = headerLineCount

  const maxContentLines = maxLinesPerPage - headerTemplate.length

  rows.forEach(row => {
    if (currentLineCount + rowLineCost > maxContentLines && currentRows.length > 0) {
      pagesWithoutLegend.push(currentRows)
      currentRows = []
      currentLineCount = headerLineCount
    }

    if (rowLineCost > maxContentLines - headerLineCount && currentRows.length === 0) {
      // Fallback: ensure progress even if a single row would overflow
      pagesWithoutLegend.push([row])
      currentLineCount = headerLineCount
      currentRows = []
      return
    }

    currentRows.push(row)
    currentLineCount += rowLineCost
  })

  if (currentRows.length > 0) {
    pagesWithoutLegend.push(currentRows)
  }

  if (pagesWithoutLegend.length === 0) {
    pagesWithoutLegend.push([])
  }

  const legendLineCount = legendLines.length
  let legendIndex = 0
  pagesWithoutLegend.forEach((rowsSlice, index) => {
    const isLastPage = index === pagesWithoutLegend.length - 1
    if (legendLineCount > 0 && isLastPage) {
      legendIndex = pushPage(rowsSlice, legendIndex)
    } else {
      pushPage(rowsSlice, legendLineCount)
    }
  })

  while (legendIndex < legendLineCount) {
    legendIndex = pushPage([], legendIndex)
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

  const pages = formatShiftGrid(month)
  const pdfContent = buildPdfDocument(pages)

  const blob = new Blob([pdfContent], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `turni-${month.ym}.pdf`
  anchor.click()
  URL.revokeObjectURL(url)
}
