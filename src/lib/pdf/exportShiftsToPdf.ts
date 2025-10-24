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

function truncateEnd(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  return value.slice(0, maxLength)
}

function padEnd(value: string, width: number): string {
  if (value.length >= width) {
    return value
  }

  return `${value}${' '.repeat(width - value.length)}`
}

function padStart(value: string, width: number): string {
  if (value.length >= width) {
    return value
  }

  return `${' '.repeat(width - value.length)}${value}`
}

function formatShiftCell(codes: string[] | null, width: number): string {
  if (!codes || codes.length === 0) {
    return ''.padEnd(width, ' ')
  }

  const joined = codes.join('+')
  return padStart(truncateEnd(joined, width), width)
}

function clampNameWidth(width: number): number {
  return Math.max(16, Math.min(36, width))
}

function buildHeaderLine(daysInMonth: number, nameWidth: number, dayWidth: number): string {
  const headerParts = [padEnd('Medico', nameWidth)]
  for (let day = 1; day <= daysInMonth; day += 1) {
    headerParts.push(padStart(day.toString().padStart(2, '0'), dayWidth))
  }

  return headerParts.join(' ')
}

function buildRowLine(
  displayName: string,
  codes: (string[] | null)[],
  daysInMonth: number,
  nameWidth: number,
  dayWidth: number
): string {
  const rowParts = [padEnd(truncateEnd(displayName, nameWidth), nameWidth)]

  for (let day = 0; day < daysInMonth; day += 1) {
    rowParts.push(formatShiftCell(codes[day] ?? null, dayWidth))
  }

  return rowParts.join(' ')
}

function buildLegendLines(month: MonthShifts, maxWidth: number): PageLine[] {
  if (!month.codes || month.codes.length === 0) {
    return []
  }

  const lines: PageLine[] = [{ text: '', fontSize: DEFAULT_FONT_SIZE }, { text: 'Legenda codici:', fontSize: DEFAULT_FONT_SIZE }]

  month.codes.forEach(code => {
    const friendly = month.shiftNames?.[code]
    const entry = friendly ? `${code} – ${friendly}` : code
    if (entry.length > maxWidth) {
      lines.push({ text: truncateEnd(entry, maxWidth), fontSize: DEFAULT_FONT_SIZE })
    } else {
      lines.push({ text: entry, fontSize: DEFAULT_FONT_SIZE })
    }
  })

  return lines
}

function buildShiftPages(month: MonthShifts): PageLine[][] {
  const daysInMonth = getDaysInMonth(month.ym)
  const title = `Turni ${formatMonthLabel(month.ym)}`
  const timestamp = new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date())

  const peopleWithDisplay = month.people
    .map((person, index) => {
      const displayName = getDoctorDisplayName(person.id, person.name).display
      return {
        index,
        displayName,
      }
    })
    .filter(person => !person.displayName.startsWith('zzz_'))

  const nameWidth = clampNameWidth(
    peopleWithDisplay.reduce((max, person) => Math.max(max, person.displayName.length), 'Medico'.length)
  )
  const dayWidth = 4
  const headerLine = buildHeaderLine(daysInMonth, nameWidth, dayWidth)
  const separatorLine = '-'.repeat(headerLine.length)
  const legendLines = buildLegendLines(
    month,
    Math.floor((PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN) / (DEFAULT_FONT_SIZE * 0.6))
  )

  const rowLines: PageLine[] = peopleWithDisplay.map(person => {
    const codes = month.rows[person.index] ?? []
    return {
      text: buildRowLine(person.displayName, codes, daysInMonth, nameWidth, dayWidth),
      fontSize: DEFAULT_FONT_SIZE,
    }
  })

  const availableHeight = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN
  const maxLinesPerPage = Math.max(1, Math.floor(availableHeight / LINE_HEIGHT))

  const firstPageHeader: PageLine[] = [
    { text: title, fontSize: 14 },
    { text: `Esportato il ${timestamp}`, fontSize: 10 },
    { text: '', fontSize: DEFAULT_FONT_SIZE },
    { text: headerLine, fontSize: DEFAULT_FONT_SIZE },
    { text: separatorLine, fontSize: DEFAULT_FONT_SIZE },
  ]

  const continuationHeader: PageLine[] = [
    { text: `${title} (continua)`, fontSize: 14 },
    { text: '', fontSize: DEFAULT_FONT_SIZE },
    { text: headerLine, fontSize: DEFAULT_FONT_SIZE },
    { text: separatorLine, fontSize: DEFAULT_FONT_SIZE },
  ]

  const pages: PageLine[][] = []
  const firstPageCapacity = Math.max(0, maxLinesPerPage - firstPageHeader.length)
  const firstPageRows = rowLines.slice(0, firstPageCapacity)
  pages.push([...firstPageHeader, ...firstPageRows])

  let consumed = firstPageRows.length
  while (consumed < rowLines.length) {
    const remaining = rowLines.slice(consumed)
    const capacity = Math.max(0, maxLinesPerPage - continuationHeader.length)

    if (capacity === 0) {
      pages.push([...continuationHeader])
      break
    }

    const pageRows = remaining.slice(0, capacity)
    pages.push([...continuationHeader, ...pageRows])
    consumed += pageRows.length
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

  const pages = buildShiftPages(month)
  const pdfContent = buildPdfDocument(pages)

  const blob = new Blob([pdfContent], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `turni-${month.ym}.pdf`
  anchor.click()
  URL.revokeObjectURL(url)
}
